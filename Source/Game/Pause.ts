/** Holding the room still: the host stopping the game to talk to everyone, and starting it
 * again. Its own file because a pause belongs to no phase and has to hold across all of them,
 * which is what the state it touches — the members every phase carries — is for. */
import { assertNever } from '@/Core';
import { HostState } from './GameState';
import type { ActionOf, GameAction } from './GameActions';

/** The moments a pause holds still, moved on by however long the room was held: a phase's own
 * start, the answer's reveal, the room's roll and the question being written out, which are the
 * four a client counts against. */
function shifted(state: HostState, byMs: number): HostState {
  switch (state.phase) {
    case 'Lobby':
    case 'Final':
      // Nothing is being counted here, so there is nothing to move on.
      return state;
    case 'Choosing':
      return {
        ...state,
        startedAt: state.startedAt + byMs,
        answeredAt: state.answeredAt === undefined ? undefined : state.answeredAt + byMs,
        picking:
          state.picking === undefined
            ? undefined
            : { ...state.picking, startedAt: state.picking.startedAt + byMs },
        questionAt: state.questionAt === undefined ? undefined : state.questionAt + byMs,
      };
    case 'Writing':
    case 'Reviewing':
    case 'Scores':
      return { ...state, startedAt: state.startedAt + byMs };
    default:
      return assertNever(state);
  }
}

/** Whether a held room refuses this request: anything a player would do to play, and the host's
 * own step forward. A hold stops the game rather than ending it, so letting go is a pause
 * action of its own and a jump past a held phase is not a way out of one. */
export function isRefusedWhileHeld(state: HostState, action: GameAction): boolean {
  if (!state.paused) {
    return false;
  }
  switch (action.type) {
    case 'PAUSE':
    case 'RESUME':
    case 'JOIN':
    case 'SET_ONLINE':
    case 'KICK':
    case 'SET_LOOK':
      return false;
    default:
      return true;
  }
}

/** Holding the room and letting it go, in one entry: one thing from two hands, and a caller that
 * knows which it wanted does not have to branch to find the rule. */
export function handleHold(
  state: HostState,
  action: Extract<GameAction, { type: 'PAUSE' | 'RESUME' }>
): HostState {
  switch (action.type) {
    case 'PAUSE':
      return handlePause(state, action);
    case 'RESUME':
      return handleResume(state, action);
    default:
      return assertNever(action);
  }
}

/** The host holding the room. Refused twice, since a second hold is the same hold and would make
 * the time it lasted read as shorter than it was. */
export function handlePause(state: HostState, action: ActionOf<'PAUSE'>): HostState {
  if (state.paused) {
    return state;
  }
  return { ...state, paused: true, pausedAt: action.at };
}

/** The room running again. The phase clock moves on by exactly the time the room was held rather
 * than by however long the host took to let go, so the room comes back to the second it left
 * and not to one that has been over. */
export function handleResume(state: HostState, action: ActionOf<'RESUME'>): HostState {
  if (!state.paused || state.pausedAt === undefined) {
    return state;
  }
  const held = Math.max(0, action.at - state.pausedAt);
  return { ...shifted(state, held), paused: false, pausedAt: undefined };
}
