import type { ActionOf } from './GameActions';
import type { HostState } from './GameState';

/** Whether a player is writing over an answer they already sent. Held beside the answers rather
 * than inside them, since the answer itself stays exactly what they last sent until they send
 * another: a player who changes their mind and runs out of time keeps the answer they had. */
export function handleEditingAnswer(
  state: HostState,
  action: ActionOf<'EDITING_ANSWER'>
): HostState {
  if (state.phase !== 'Writing' || !state.answers.has(action.playerId)) {
    return state;
  }
  const editing = new Set(state.editing ?? []);
  if (action.editing) {
    editing.add(action.playerId);
  } else {
    editing.delete(action.playerId);
  }
  return { ...state, editing };
}
