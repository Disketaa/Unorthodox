import { PlayerId, PlayerLook } from '@/Core';
import { HostState } from './GameState';
import { scoreRound } from './RoundScoring';

export type GameAction =
  | { type: 'JOIN'; playerId: PlayerId; name: string; look: PlayerLook }
  | { type: 'SET_ONLINE'; playerId: PlayerId; isOnline: boolean }
  | { type: 'KICK'; playerId: PlayerId }
  | { type: 'SET_LOOK'; playerId: PlayerId; look: PlayerLook }
  | { type: 'START_GAME'; topic: string; durationMs: number; startedAt: number }
  | { type: 'SUBMIT_ANSWER'; playerId: PlayerId; text: string }
  | { type: 'START_REVIEWING'; startedAt: number; durationMs: number }
  | { type: 'REJECT_GROUP'; playerId: PlayerId; groupId: number }
  | { type: 'END_REVIEWING'; startedAt: number; durationMs: number }
  | { type: 'NEXT_ROUND'; topic: string; durationMs: number; startedAt: number }
  | { type: 'FINAL' };

export type ActionOf<T extends GameAction['type']> = Extract<GameAction, { type: T }>;

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
  const { roundScores, cumulativeScores } = scoreRound(state);
  return {
    phase: 'Scores',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    scores: roundScores,
    cumulativeScores,
  };
}

export function handleNextRound(state: HostState, action: ActionOf<'NEXT_ROUND'>): HostState {
  if (state.phase !== 'Reviewing' && state.phase !== 'Scores') {
    return state;
  }
  // Round points were already folded into `cumulativeScores` by END_REVIEWING, so
  // totals carry over untouched here. A round abandoned from Reviewing never
  // scored, so it also carries over as-is.
  return {
    phase: 'Writing',
    topic: action.topic,
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    answers: new Map<PlayerId, string>(),
    cumulativeScores: state.cumulativeScores,
  };
}

export function handleFinal(state: HostState): HostState {
  if (state.phase !== 'Scores' && state.phase !== 'Reviewing') {
    return state;
  }
  return {
    phase: 'Final',
    cumulativeScores: state.cumulativeScores,
  };
}
