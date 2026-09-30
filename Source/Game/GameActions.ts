import { PlayerId } from '@/Core';
import { HostState } from './GameState';
import { GameConfig } from './GameConfig';
import { groupAnswersWithPlayers } from './Grouping';
import { calculateRoundScores } from './Scoring';

// Define the action types
export type GameAction =
  | { type: 'JOIN'; playerId: PlayerId; name: string }
  | { type: 'START_GAME'; topic: string; durationMs: number; startedAt: number }
  | { type: 'SUBMIT_ANSWER'; playerId: PlayerId; text: string }
  | { type: 'START_REVIEWING'; startedAt: number; durationMs: number }
  | { type: 'REJECT_GROUP'; playerId: PlayerId; groupId: number }
  | { type: 'END_REVIEWING'; startedAt: number; durationMs: number }
  | { type: 'NEXT_ROUND'; topic: string; durationMs: number; startedAt: number };

export type ActionOf<T extends GameAction['type']> = Extract<GameAction, { type: T }>;

export function handleJoin(state: HostState, action: ActionOf<'JOIN'>): HostState {
  if (state.phase !== 'Lobby') {
    return state;
  }
  const newPlayers = new Map(state.players);
  newPlayers.set(action.playerId, action.name);
  return {
    phase: 'Lobby',
    players: newPlayers,
    cumulativeScores: state.cumulativeScores,
  };
}

export function handleStartGame(state: HostState, action: ActionOf<'START_GAME'>): HostState {
  if (state.phase !== 'Lobby' || state.players.size === 0) {
    return state;
  }
  return {
    phase: 'Writing',
    topic: action.topic,
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    answers: new Map<PlayerId, string>(),
    cumulativeScores: state.cumulativeScores,
  };
}

export function handleSubmitAnswer(
  state: HostState,
  action: ActionOf<'SUBMIT_ANSWER'>
): HostState {
  if (state.phase !== 'Writing') {
    return state;
  }
  const newAnswers = new Map(state.answers);
  newAnswers.set(action.playerId, action.text);
  return {
    phase: 'Writing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    answers: newAnswers,
    cumulativeScores: state.cumulativeScores,
  };
}

export function handleStartReviewing(
  state: HostState,
  action: ActionOf<'START_REVIEWING'>
): HostState {
  if (state.phase !== 'Writing') {
    return state;
  }
  return {
    phase: 'Reviewing',
    topic: state.topic,
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    answers: state.answers,
    groupRejections: new Map<number, Set<PlayerId>>(),
    cumulativeScores: state.cumulativeScores,
  };
}

export function handleRejectGroup(
  state: HostState,
  action: ActionOf<'REJECT_GROUP'>
): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }
  const newGroupRejections = new Map(state.groupRejections);
  const currentSet = newGroupRejections.get(action.groupId) ?? new Set<PlayerId>();
  currentSet.add(action.playerId);
  newGroupRejections.set(action.groupId, currentSet);
  return {
    phase: 'Reviewing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    answers: state.answers,
    groupRejections: newGroupRejections,
    cumulativeScores: state.cumulativeScores,
  };
}

export function handleEndReviewing(
  state: HostState,
  action: ActionOf<'END_REVIEWING'>
): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }

  // A group is rejected when a strict majority of its players rejected it.
  const groupsForScoring = groupAnswersWithPlayers(state.answers).map(group => {
    const rejectionSet = state.groupRejections.get(group.groupId) ?? new Set<PlayerId>();
    return {
      playerIds: group.playerIds,
      isRejected: rejectionSet.size > group.playerIds.length / 2,
    };
  });

  const roundScores = calculateRoundScores(groupsForScoring, GameConfig);

  // Add this round's scores onto the running totals
  const newCumulativeScores = new Map(state.cumulativeScores);
  for (const [playerId, score] of roundScores) {
    const currentScore = newCumulativeScores.get(playerId) ?? 0;
    newCumulativeScores.set(playerId, currentScore + score);
  }

  return {
    phase: 'Scores',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    scores: roundScores,
    cumulativeScores: newCumulativeScores,
  };
}

export function handleNextRound(state: HostState, action: ActionOf<'NEXT_ROUND'>): HostState {
  if (state.phase !== 'Reviewing' && state.phase !== 'Scores') {
    return state;
  }
  // From Scores, fold this round's results into the running totals. From
  // Reviewing the round was abandoned before scoring, so totals carry over as-is.
  const newCumulativeScores = new Map(state.cumulativeScores);
  if (state.phase === 'Scores') {
    for (const [playerId, score] of state.scores) {
      newCumulativeScores.set(playerId, (newCumulativeScores.get(playerId) ?? 0) + score);
    }
  }
  return {
    phase: 'Writing',
    topic: action.topic,
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    answers: new Map<PlayerId, string>(),
    cumulativeScores: newCumulativeScores,
  };
}
