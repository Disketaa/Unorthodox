/** The handlers that move the room between phases. Each names its own guard: a phase it does not
 * act on is returned untouched, which is what makes a late message a no-op rather than a
 * change. */
import { PlayerId, assertNever } from '@/Core';
import { HostState } from './GameState';
import { scoreRound } from './RoundScoring';
import type { PhaseName } from './PhaseFlow';
import type { ActionOf } from './GameActions';

export function handleStartGame(state: HostState, action: ActionOf<'START_GAME'>): HostState {
  if (state.phase !== 'Lobby' || state.players.size === 0) {
    return state;
  }
  return {
    ...membersOf(state),
    phase: 'Choosing',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
  };
}

export function handleStartWriting(state: HostState, action: ActionOf<'START_WRITING'>): HostState {
  if (state.phase !== 'Choosing') {
    return state;
  }
  return {
    ...membersOf(state),
    phase: 'Writing',
    topic: action.topic,
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    answers: new Map<PlayerId, string>(),
  };
}

export function handleSubmitAnswer(
  state: HostState,
  action: ActionOf<'SUBMIT_ANSWER'>
): HostState {
  if (state.phase !== 'Writing') {
    return state;
  }
  const answers = new Map(state.answers);
  answers.set(action.playerId, action.text);
  return { ...state, answers };
}

export function handleStartReviewing(
  state: HostState,
  action: ActionOf<'START_REVIEWING'>
): HostState {
  if (state.phase !== 'Writing') {
    return state;
  }
  return {
    ...state,
    phase: 'Reviewing',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    groupRejections: new Map<number, Set<PlayerId>>(),
  };
}

export function handleRejectGroup(
  state: HostState,
  action: ActionOf<'REJECT_GROUP'>
): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }
  const rejections = new Map(state.groupRejections);
  const rejected = rejections.get(action.groupId) ?? new Set<PlayerId>();
  rejected.add(action.playerId);
  rejections.set(action.groupId, rejected);
  return { ...state, groupRejections: rejections };
}

export function handleEndReviewing(state: HostState, action: ActionOf<'END_REVIEWING'>): HostState {
  if (state.phase !== 'Reviewing') {
    return state;
  }
  const { roundScores, cumulativeScores } = scoreRound(state);
  return {
    ...membersOf(state),
    phase: 'Scores',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    scores: roundScores,
    cumulativeScores,
  };
}

/** Into the next round's theme choice. Round points were already folded into `cumulativeScores`
 * by END_REVIEWING, so totals carry over untouched here, and a round abandoned from Reviewing
 * never scored and carries over as-is. */
export function handleNextRound(state: HostState, action: ActionOf<'NEXT_ROUND'>): HostState {
  if (state.phase !== 'Reviewing' && state.phase !== 'Scores') {
    return state;
  }
  return {
    ...membersOf(state),
    phase: 'Choosing',
    durationMs: action.durationMs,
    startedAt: action.startedAt,
  };
}

export function handleFinal(state: HostState): HostState {
  if (state.phase !== 'Scores' && state.phase !== 'Reviewing') {
    return state;
  }
  return { ...membersOf(state), phase: 'Final' };
}

/** What every phase carries out of the one it was in: the roster, the totals, the turn and the
 * pace. Spreading this rather than naming all four in each handler is what keeps a phase from
 * being added without being told about the room around it. */
function membersOf(state: HostState) {
  return {
    players: state.players,
    cumulativeScores: state.cumulativeScores,
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
  };
}

/** The room put straight into a phase, for the host's console. Round data is started empty
 * rather than carried, so a jump into Reviewing shows an empty bank rather than answers nobody
 * wrote. */
export function handleGoToPhase(state: HostState, action: ActionOf<'GO_TO_PHASE'>): HostState {
  const base = { ...membersOf(state), durationMs: action.durationMs, startedAt: action.startedAt };
  return { ...phaseBody(base, state, action.phase, action.topic), ...base };
}

/** The part of a phase that is not the room around it. One switch rather than one handler per
 * phase, since a jump is a debug affordance and its rules are exactly the shape of the state. */
function phaseBody(
  base: { durationMs: number; startedAt: number },
  state: HostState,
  phase: PhaseName,
  topic: string,
) {
  switch (phase) {
    case 'Lobby':
      return { phase, ...membersOf(state) };
    case 'Choosing':
      return { phase, ...base };
    case 'Writing':
      return { phase, ...base, topic, answers: new Map<PlayerId, string>() };
    case 'Reviewing':
      return { phase, ...base, topic, answers: new Map<PlayerId, string>(), groupRejections: new Map() };
    case 'Scores':
      return { phase, ...base, scores: new Map<PlayerId, number>() };
    case 'Final':
      return { phase, ...membersOf(state) };
    default:
      return assertNever(phase);
  }
}
