/** A bank that closed with nothing pressed on it, which the room then answers itself. Its own
 * file because it is a room answer with no seat behind it: it has no player to refuse and no
 * turn to check, so it shares nothing with the press handlers but the round it spends. */
import { HostState } from './GameState';
import { roundsAfter } from './ThemeRounds';
import { assertNever } from '@/Core';
import type { ActionOf, GameAction } from './GameActions';

/** The room's answer to a bank nobody gave one, in both its halves. One entry rather than two
 * because they are one event seen from either end: the roll starting and the roll committing. */
export function handleBankPick(
  state: HostState,
  action: Extract<GameAction, { type: 'START_RANDOM_PICK' | 'RESOLVE_RANDOM_PICK' }>
): HostState {
  switch (action.type) {
    case 'START_RANDOM_PICK':
      return handleStartRandomPick(state, action);
    case 'RESOLVE_RANDOM_PICK':
      return handleResolveRandomPick(state);
    default:
      return assertNever(action);
  }
}

/** The bank left open past its own clock, so the room answers it. Refused once anything has been
 * pressed, and refused twice, since a second roll is a second answer to one bank. */
export function handleStartRandomPick(
  state: HostState,
  action: ActionOf<'START_RANDOM_PICK'>
): HostState {
  if (state.phase !== 'Choosing' || state.theme !== undefined || state.picking !== undefined) {
    return state;
  }
  return { ...state, picking: { theme: action.theme, startedAt: action.startedAt } };
}

/** The roll commits, which is the same answer a press gives and spends the same round. */
export function handleResolveRandomPick(state: HostState): HostState {
  if (state.phase !== 'Choosing' || state.picking === undefined) {
    return state;
  }
  return {
    ...state,
    theme: state.picking.theme,
    picking: undefined,
    themeRounds: roundsAfter(state.themeRounds, state.picking.theme),
  };
}
