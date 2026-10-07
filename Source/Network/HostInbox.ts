/** What the host does with a message from a client, and the only place one is read. Split out of
 * the session so the file that owns the room owns no wire format. */
import type { ClientMessage } from './Protocol';
import { isClientMessage } from './Protocol';
import { toAction } from './HostIncoming';
import type { GameAction } from '@/Game';
import { createLogger } from '@/Core';
import type { HostRoom } from './HostRoom';
import type { Transport } from './Transport';

const log = createLogger('HostInbox');

export class HostInbox {
  constructor(
    private readonly wire: Transport,
    private readonly room: HostRoom,
    private readonly apply: (action: GameAction) => void
  ) {}

  /** Take everything the wire has to say. A message the host sent itself comes back on the same
   * wire and is not a client's, and one that does not parse is dropped rather than guessed at. */
  listen(): void {
    this.wire.onMessage((message, fromHost, peerId) => {
      log('debug', 'onMessage', message, 'from peer:', peerId);
      if (fromHost) return;
      if (!isClientMessage(message)) {
        log('warn', 'ignoring unrecognised client message');
        return;
      }
      this.handle(message, peerId);
    });
  }

  /** The peerId is the transport address the message arrived from, not a player id. */
  private handle(message: ClientMessage, peerId: string): void {
    if (message.type === 'Sync') {
      // A client that was away asks for the current state, which carries the phase start
      // time so it resumes counting from the truth.
      log('debug', 'resending state to peer', peerId);
      this.room.broadcastState();
      return;
    }
    const state = this.room.getState();
    if (state === undefined) {
      return;
    }
    const action = toAction({
      message,
      peerId,
      roster: this.room.roster,
      transport: this.wire,
      state,
    });
    if (action !== undefined) {
      this.apply(action);
    }
  }
}
