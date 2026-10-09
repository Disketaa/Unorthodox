import type { Transport } from './Transport';
import { isHostMessage, type BlockedReason, type HostMessage } from './Protocol';
import { refusalFor } from './ClientRefusals';
import type { JoinRetry } from './JoinRetry';
import { createLogger } from '@/Core';
import type * as Game from '@/Game';
import { ClockFollow } from '@/Core';

const log = createLogger('ClientSession');

/** What the host has told this client so far. Split from the session's own lifecycle because the
 * two change for different reasons: the session starts, stops and sends, while this is only
 * ever written when a message arrives, and the two have no reason to move together. */
export class ClientInbox {
  state: Game.PublicState | undefined = undefined;
  /** Assigned by the host on Join, never chosen here. */
  playerId: string | null = null;
  /** Skew between the host's clock and this device's, narrowed over every message received. */
  readonly clock = new ClockFollow();
  /** Why this player is not in the room, if they are not. */
  blocked: BlockedReason | undefined = undefined;
  /** How many players the room holds, as the host reported it in a full-room refusal. */
  roomLimit = 0;

  constructor(
    private readonly transport: Transport,
    private readonly joinRetry: JoinRetry,
    private readonly onChange: () => void,
  ) {}

  /** Apply one message from the host, or discard it if it is not one this client understands. */
  receive(message: HostMessage): void {
    const refusal = refusalFor(message);
    if (refusal !== undefined) {
      log('info', 'refused by the host:', refusal.reason);
      this.blocked = refusal.reason;
      this.roomLimit = refusal.roomLimit;
      // The retry stops either way: the join has been answered, and a host that has just refused
      // one will refuse it again, so a retry would be this tab knocking on a closed door.
      this.joinRetry.stop();
      if (refusal.closes) {
        this.transport.stop();
      }
      this.onChange();
      return;
    }
    switch (message.type) {
      case 'State':
        this.state = message.state;
        // Narrowed rather than replaced, since one sample carries a whole one-way trip in it and
        // the room is only in step at its shortest.
        this.clock.read(message.hostNow, Date.now());
        log('debug', 'state updated to', message.state.phase, 'offset', this.clock.offset);
        this.onChange();
        break;
      case 'SetPlayerId':
        log('info', 'playerId assigned:', message.playerId);
        this.playerId = message.playerId;
        // The host has answered, so the join no longer needs retrying.
        this.joinRetry.stop();
        this.onChange();
        break;
    }
  }

  /** What the host has said, dropped on stop so a fresh room never inherits the last one. */
  clear(): void {
    this.state = undefined;
    this.playerId = null;
    this.blocked = undefined;
    this.roomLimit = 0;
  }
}

/** Whether the transport can be trusted to have delivered a message worth reading. */
export function isFromHost(message: unknown, fromHost: boolean): message is HostMessage {
  return fromHost && isHostMessage(message);
}
