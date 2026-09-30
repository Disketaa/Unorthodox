import { PlayerId } from '@/Core';
import { HostState } from './GameState';
import { assertNever } from '@/Core';
import { GameConfig } from './GameConfig';

// Define the action types
export type GameAction =
  | { type: 'JOIN'; playerId: PlayerId; name: string }
  | { type: 'START_GAME'; topic: string; durationMs: number; startedAt: number }
  | { type: 'SUBMIT_ANSWER'; playerId: PlayerId; text: string }
  | { type: 'REJECT_GROUP'; playerId: PlayerId; groupId: number }
  | { type: 'END_REVIEWING'; startedAt: number; durationMs: number }
  | { type: 'NEXT_ROUND'; topic: string; durationMs: number; startedAt: number };

/**
 * Reducer function for the game state.
 * @param currentState Current host state
 * @param action Action to process
 * @returns New host state
 */
export function reducer(
  currentState: HostState | undefined,
  action: GameAction
): HostState {
  const state: HostState = currentState ?? {
    phase: 'Lobby',
    players: new Map(),
    cumulativeScores: new Map<PlayerId, number>(),
  };

  switch (action.type) {
    case 'JOIN':
      return handleJoin(state, action);
    case 'START_GAME':
      return handleStartGame(state, action);
    case 'SUBMIT_ANSWER':
      return handleSubmitAnswer(state, action);
    case 'REJECT_GROUP':
      return handleRejectGroup(state, action);
    case 'END_REVIEWING':
      return handleEndReviewing(state, action);
    case 'NEXT_ROUND':
      return handleNextRound(state, action);
    default:
      return assertNever(action);
  }
}

function handleJoin(state: HostState, action: GameAction): HostState {
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

function handleStartGame(state: HostState, action: GameAction): HostState {
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

function handleSubmitAnswer(state: HostState, action: GameAction): HostState {
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

function handleRejectGroup(state: HostState, action: GameAction): HostState {
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

function handleNextRound(state: HostState, action: GameAction): HostState {
  if (state.phase !== 'Scores') {
    return state;
  }
  // Compute new cumulative scores by adding the round scores to the old cumulative scores
  const newCumulativeScores = new Map(state.cumulativeScores);
  for (const [playerId, score] of state.scores) {
    const currentScore = newCumulativeScores.get(playerId) ?? 0;
    newCumulativeScores.set(playerId, currentScore + score);
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

function handleEndReviewing(state: HostState, action: GameAction): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }

  // Group answers with player IDs
  const groupsWithPlayers = groupAnswersWithPlayers(state.answers);

  // Determine which groups are rejected
  const groupsForScoring = groupsWithPlayers.map(group => {
    const rejectionSet = state.groupRejections.get(group.groupId) ?? new Set<PlayerId>();
    const isRejected = rejectionSet.size > (group.playerIds.length / 2);
    return {
      playerIds: group.playerIds,
      isRejected,
    };
  });

  // Calculate round scores for each player
  const roundScores = calculateRoundScores(groupsForScoring, GameConfig);

  // Update cumulative scores by adding round scores
  const newCumulativeScores = new Map(state.cumulativeScores);
  for (const [playerId, score] of roundScores) {
    const currentScore = newCumulativeScores.get(playerId) ?? 0;
    newCumulativeScores.set(playerId, currentScore + score);
  }

  // Transition to Scores state
  return {
    phase: 'Scores',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    scores: roundScores,
    cumulativeScores: newCumulativeScores,
  };
}