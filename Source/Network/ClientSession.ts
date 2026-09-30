import { Transport } from './Transport';
import { isHostMessage, HostMessage } from './Protocol';
import * as Game from '@/Game';
import { PlayerLook, createLogger, measureClockOffset } from '@/Core';

const log = createLogger('ClientSession');

/** How often a join is re-sent while waiting for the host to become reachable. */
export const JoinRetryIntervalMs = 2_000;

/**
 * How often the client asks the host where the game is.
 *
 * A client that was suspended, backgrounded or offline misses the state
 * messages sent on phase changes, so it asks again on a timer. It also makes
 * the countdown correct after the client wakes up, because the state carries the
 * host's phase start time rather than the moment the client received it.
 */
export const SyncIntervalMs = 5_000;

/**
 * Manages the client side of the game state and communication.
 */
export class ClientSession {
  private state: Game.PublicState | undefined = undefined;
  private transport: Transport;
  private playerId: string | null = null; // We'll set this when we receive a SetPlayerId message from the host
  private updateListener: (() => void) | undefined = undefined;
  /** Join message held back until the transport can address the host. */
  private pendingJoin: { type: 'Join'; name: string; look: PlayerLook } | null = null;
  /** Retries the buffered join until the host assigns us an id. */
  private joinRetry: ReturnType<typeof setInterval> | null = null;
  /** Asks the host for the current state, so a gap does not desync the client. */
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  /** Skew between the host's clock and this device's, in milliseconds. */
  private clockOffsetMs = 0;

  /** Subscribe to state changes so the UI can re-render. */
  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  /** Called when the host leaves. The transport only reports host departures to clients. */
  onHostLeave(listener: () => void): void {
    this.transport.onPeerLeave(() => listener());
  }

  /**
   * Send the buffered join as soon as the host is addressable.
   *
   * Retrying on a timer alone leaves up to one interval of dead air after the
   * connection completes, which reads as a hang. The timer stays as a backstop
   * for the case where the host is addressable but the first send is lost.
   */
  private flushPendingJoin(): void {
    if (!this.pendingJoin || this.playerId !== null) {
      return;
    }
    // The host has to announce itself before it can be addressed. Reporting a
    // send that the transport is about to drop is what made a room that never
    // connected look as though it was.
    if (!this.transport.isHostAddressable()) {
      log('debug', 'host has not announced itself yet, holding the join back');
      return;
    }
    log('info', 'host is reachable, sending the join now');
    this.transport.sendToHost(this.pendingJoin);
  }

  /** Keep asking to join until the host answers. */
  private startJoinRetries(): void {
    if (this.joinRetry !== null) {
      return;
    }
    this.joinRetry = setInterval(() => {
      if (this.playerId !== null) {
        this.stopJoinRetries();
        return;
      }
      this.flushPendingJoin();
    }, JoinRetryIntervalMs);
  }

  private stopJoinRetries(): void {
    if (this.joinRetry !== null) {
      clearInterval(this.joinRetry);
      this.joinRetry = null;
    }
  }

  constructor(transport: Transport) {
    this.transport = transport;

    // The host is reachable the moment it registers on the in-memory broker,
    // so the join can go out without waiting for a retry tick.
    this.transport.onHostReady(() => this.flushPendingJoin());

    // Set up incoming message handler
    this.transport.onMessage((message, fromHost) => {
      log('debug', 'onMessage', message, 'fromHost:', fromHost);
      // We only expect messages from the host (fromHost should be true)
      if (!fromHost) {
        // Ignore messages from clients (shouldn't happen in a correct setup)
        return;
      }
      if (!isHostMessage(message)) {
        log('warn', 'ignoring unrecognised host message');
        return;
      }
      this.handleHostMessage(message);
    });
  }

  /** Start the client session with a room code and player name */
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

  /** Stop the client session */
  stop(): void {
    log('info', 'stopping client session');
    this.stopJoinRetries();
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.transport.stop();
    this.state = undefined;
    this.playerId = null;
    this.pendingJoin = null;
    this.updateListener = undefined;
  }

  /** Handle a message from the host */
  private handleHostMessage(message: HostMessage): void {
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
        this.stopJoinRetries();
        this.pendingJoin = null;
        this.updateListener?.();
        break;
    }
  }

  /** Send a join message to the host */
  join(playerName: string, look: PlayerLook): void {
    log('info', 'joining as', playerName);
    this.pendingJoin = { type: 'Join', name: playerName, look };
    this.transport.sendToHost(this.pendingJoin);
    // The first attempt may land before the host is reachable, so keep trying.
    this.startJoinRetries();
  }

  /**
   * Ask the host to change this player's character.
   *
   * The look the player picks here is the one they arrived with, until they
   * change it. The host may refuse: it keeps the character a returning player
   * already had, and it stops honouring changes once the game starts.
   */
  setLook(look: PlayerLook): void {
    if (this.playerId === null) {
      log('warn', 'cannot set a look before receiving a playerId');
      return;
    }
    this.transport.sendToHost({ type: 'SetLook', playerId: this.playerId, look });
  }

  /** Send an answer submission to the host */
  submitAnswer(text: string): void {
    if (this.playerId === null) {
      // We don't have a playerId yet, ignore or wait?
      log('warn', 'cannot submit answer before receiving a playerId');
      return;
    }
    this.transport.sendToHost({ type: 'SubmitAnswer', text, playerId: this.playerId });
  }

  /** Send a group rejection to the host */
  rejectGroup(groupId: number): void {
    if (this.playerId === null) {
      // We don't have a playerId yet, ignore or wait?
      log('warn', 'cannot reject group before receiving a playerId');
      return;
    }
    this.transport.sendToHost({ type: 'RejectGroup', groupId, playerId: this.playerId });
  }

  /** Get the current public state */
  getState(): Game.PublicState | undefined {
    return this.state;
  }

  /** Skew between the host's clock and this device's, for counting phases down. */
  getClockOffsetMs(): number {
    return this.clockOffsetMs;
  }

  /** Get the player ID assigned by the host */
  getPlayerId(): string | null {
    return this.playerId;
  }
}
