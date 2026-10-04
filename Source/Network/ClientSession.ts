import { Transport } from './Transport';
import { isHostMessage, HostMessage, BlockedReason } from './Protocol';
import { refusalFor } from './ClientRefusals';
import { JoinRetry } from './JoinRetry';
import { clientId } from './ClientIdentity';
import * as Game from '@/Game';
import { PlayerLook, createLogger, measureClockOffset } from '@/Core';

export type { BlockedReason } from './Protocol';

const log = createLogger('ClientSession');

/**
 * How often the client asks the host where the game is.
 *
 * A client that was suspended, backgrounded or offline misses the state messages sent on phase
 * changes, so it asks again on a timer. It also makes the countdown correct after the client
 * wakes up, because the state carries the host's phase start time rather than the moment the
 * client received it.
 */
export const SyncIntervalMs = 5_000;

export class ClientSession {
  private state: Game.PublicState | undefined = undefined;
  private transport: Transport;
  /** Assigned by the host on Join, never chosen here. */
  private playerId: string | null = null;
  private updateListener: (() => void) | undefined = undefined;
  /** The join, held and re-sent until the host answers it or refuses it. */
  private readonly joinRetry: JoinRetry;
  /** Asks the host for the current state, so a gap does not desync the client. */
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  /** Skew between the host's clock and this device's, in milliseconds. */
  private clockOffsetMs = 0;
  /** Why this player is not in the room, if they are not. */
  private blocked: BlockedReason | undefined = undefined;
  /** How many players the room holds, as the host reported it in a full-room refusal. */
  private roomLimit = 0;

  /** Subscribe to state changes so the UI can re-render. */
  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  /** Called when the host leaves. The transport only reports host departures to clients. */
  onHostLeave(listener: () => void): void {
    this.transport.onPeerLeave(() => listener());
  }

  constructor(transport: Transport) {
    this.transport = transport;
    this.joinRetry = new JoinRetry(transport);

    // The host is reachable the moment it registers on the in-memory broker,
    // so the join can go out without waiting for a retry tick.
    transport.onHostReady(() => this.joinRetry.flush());

    this.transport.onMessage((message, fromHost) => {
      log('debug', 'onMessage', message, 'fromHost:', fromHost);
      if (!fromHost) {
        return;
      }
      if (!isHostMessage(message)) {
        log('warn', 'ignoring unrecognised host message');
        return;
      }
      this.handleHostMessage(message);
    });
  }

  start(roomCode: string, playerName: string): void {
    // The host addresses us by the peer the transport sees, so there is no id
    // for us to declare here. The host assigns our game player id on join.
    this.transport.start(roomCode, playerName, false);
    // A suspended client misses state updates, so it keeps asking where the game is.
    this.syncTimer = setInterval(() => this.requestSync(), SyncIntervalMs);
  }

  /** Ask the host to resend the current state and phase start time. */
  requestSync(): void {
    if (this.playerId === null) {
      // Not in the room yet; the join retry covers this case.
      return;
    }
    log('debug', 'asking the host for a state sync');
    this.transport.sendToHost({ type: 'Sync' });
  }

  stop(): void {
    log('info', 'stopping client session');
    this.joinRetry.stop();
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.transport.stop();
    this.state = undefined;
    this.playerId = null;
    this.blocked = undefined;
    this.updateListener = undefined;
  }

  private handleHostMessage(message: HostMessage): void {
    const refusal = refusalFor(message);
    if (refusal !== undefined) {
      log('info', 'refused by the host:', refusal.reason);
      this.blocked = refusal.reason;
      this.roomLimit = refusal.roomLimit;
      // The retry stops either way: the join has been answered, and a host that has just
      // refused one will refuse it again, so a retry would be this tab knocking on a closed
      // door rather than the player asking to come in.
      this.joinRetry.stop();
      if (refusal.closes) {
        this.transport.stop();
      }
      this.updateListener?.();
      return;
    }
    switch (message.type) {
      case 'State':
        this.state = message.state;
        // Remember how far the host's clock is from ours, so the phase start
        // time in the state can be read locally.
        this.clockOffsetMs = measureClockOffset(message.hostNow, Date.now());
        log('debug', 'state updated to', message.state.phase, 'offset', this.clockOffsetMs);
        this.updateListener?.();
        break;
      case 'SetPlayerId':
        log('info', 'playerId assigned:', message.playerId);
        this.playerId = message.playerId;
        // The host has answered, so the join no longer needs retrying.
        this.joinRetry.stop();
        this.updateListener?.();
        break;
    }
  }

join(playerName: string, look: PlayerLook): void {
    log('info', 'joining as', playerName);
    // Held and re-sent until the host seats us or refuses the join.
    this.joinRetry.send({
      type: 'Join',
      name: playerName,
      look,
      clientId: clientId(),
    });
  }

  /**
   * Ask the host to change this player's character.
   *
   * The look the player picks here is the one they arrived with, until they change it. The host
   * may refuse: it keeps the character a returning player already had, and it stops honouring
   * changes once the game starts.
   */
  setLook(look: PlayerLook): void {
    if (this.playerId === null) {
      log('warn', 'cannot set a look before receiving a playerId');
      return;
    }
    this.transport.sendToHost({ type: 'SetLook', playerId: this.playerId, look });
  }

  /**
   * Whether this client is seated yet, logging why not if it is not.
   *
   * Every action that names a player goes through here, because all of them are meaningless
   * before the host has assigned an id. Only a client that has reached Writing can reach this
   * at all, so the guard catches the player's own click arriving before their join did.
   */
  private seated(action: string): boolean {
    if (this.playerId !== null) {
      return true;
    }
    log('warn', `cannot ${action} before receiving a playerId`);
    return false;
  }

  submitAnswer(text: string): void {
    if (!this.seated('submit answer')) {
      return;
    }
    this.transport.sendToHost({ type: 'SubmitAnswer', text, playerId: this.playerId });
  }

  rejectGroup(groupId: number): void {
    if (!this.seated('reject group')) {
      return;
    }
    this.transport.sendToHost({ type: 'RejectGroup', groupId, playerId: this.playerId });
  }

  getState(): Game.PublicState | undefined {
    return this.state;
  }

  getClockOffsetMs(): number {
    return this.clockOffsetMs;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  /** Why this client is not in a room, or undefined if it is in one. */
  getBlocked(): BlockedReason | undefined {
    return this.blocked;
  }

  /**
   * How many players the room holds, as the host last reported it.
   *
   * Zero until a refusal says otherwise, which is the only thing the UI reads it for: a
   * full-room refusal is the one refusal whose sentence carries a number.
   */
  getRoomLimit(): number {
    return this.roomLimit;
  }
}