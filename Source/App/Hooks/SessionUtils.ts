import { navigate } from '../Routes';
import type { PublicState } from '@/Game';

/** Leave the room, by going back to the entry route. Navigation is this app's only lever, and
 * leaving the room route unmounts the room, which tears the transport down; calling `stop` here
 * too would clear the roster unread. */
export function exitRoom(): void {
  navigate('');
}

/** Read the topic of the phase in view, which identifies the round. */
export function readTopic(publicState: PublicState | undefined): string | null {
  return publicState !== undefined && 'topic' in publicState ? publicState.topic : null;
}

/** Marking the seat locally and telling the room in one step, so their own bar answers on the
 * keystroke rather than a round trip later while everybody else's answers on the room's. */
export const reportEditing =
  (mark: (v: boolean) => void, send: (v: boolean) => void) =>
  (next: boolean): void => {
    mark(next);
    send(next);
  };
