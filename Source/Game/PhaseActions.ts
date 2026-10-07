/** The handlers that move the room between phases. Each names its own guard: a phase it does not
 * act on is returned untouched, which is what makes a late message a no-op rather than a
 * change. */
import { PlayerId } from '@/Core';
import { HostState } from './GameState';
import { scoreRound } from './RoundScoring';
import { nextPlayerInTurn, turnOrder } from './Turns';
import type { ActionOf } from './GameActions';

export function handleStartGame(state: HostState, action: ActionOf<'START_GAME'>): HostState {
  if (state.phase !== 'Lobby' || state.players.size === 0) {
    return state;
  }
  return {
    ...membersOf(state),
    phase: 'Choosing',
    // Somebody holds the turn as the room starts: the bar across the top marks whose turn it is,
    // and a game begun with every seat unmarked is a game begun asking a question it cannot
    // answer. Only fills an empty turn, so a host who handed it on in the lobby keeps that seat.
    turnPlayerId: state.turnPlayerId ?? nextPlayerInTurn(null, turnOrder(state.players)),
    durationMs: action.durationMs,
    startedAt: action.startedAt,
    theme: undefined,
  };
}

/** The room's answer to the bank. Refused from anybody but the player whose turn it is, since
 * the muted cards are the promise that the turn is what limits the room and not the network. */
export function handleChooseTheme(
  state: HostState,
  action: ActionOf<'CHOOSE_THEME'>
): HostState {
  if (state.phase !== 'Choosing' || state.turnPlayerId !== action.playerId) {
    return state;
  }
  return { ...state, theme: action.theme };
}

export function handleStartWriting(
  state: HostState,
  action: ActionOf<'START_WRITING'>
): HostState {
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
    theme: state.theme,
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

export function handleEndReviewing(
  state: HostState,
  action: ActionOf<'END_REVIEWING'>
): HostState {
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
    theme: state.theme,
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
    // A new bank with nothing chosen on it, which is the whole difference between this Choosing
    // and the last: the pressed card belonged to the round that has just been scored.
    theme: undefined,
  };
}

export function handleFinal(state: HostState): HostState {
  if (state.phase !== 'Scores' && state.phase !== 'Reviewing') {
    return state;
  }
  return { ...membersOf(state), phase: 'Final', theme: state.theme };
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
