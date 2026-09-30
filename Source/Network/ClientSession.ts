import { Transport } from './Transport';
import { isHostMessage, HostMessage } from './Protocol';
import * as Game from '@/Game';
import { createLogger } from '@/Core';

const log = createLogger('ClientSession');

/** How often a join is re-sent while waiting for the host to become reachable. */
export const JoinRetryIntervalMs = 2_000;

/**
 * Manages the client side of the game state and communication.
 */
export class ClientSession {
  private state: Game.PublicState | undefined = undefined;
  private transport: Transport;
  private playerId: string | null = null; // We'll set this when we receive a SetPlayerId message from the host
  private updateListener: (() => void) | undefined = undefined;
  /** Join message held back until the transport can address the host. */
  private pendingJoin: { type: 'Join'; name: string } | null = null;
  /** Retries the buffered join until the host assigns us an id. */
  private joinRetry: ReturnType<typeof setInterval> | null = null;

  /** Subscribe to state changes so the UI can re-render. */
  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  /** Called when the host leaves. The transport only reports host departures to clients. */
  onHostLeave(listener: () => void): void {
    this.transport.onPeerLeave(() => listener());
  }

  /**
   * Keep asking to join until the host answers.
   *
   * The host only announces itself to peers that join after it, so a client
   * that arrives second may have to wait for the host lookup to complete. The
   * transport drops a send it cannot route, so the join is retried rather than
   * fired once and lost.
   */
  private startJoinRetries(): void {
    if (this.joinRetry !== null) {
      return;
    }
    this.joinRetry = setInterval(() => {
      if (this.playerId !== null) {
        this.stopJoinRetries();
        return;
      }
      if (!this.pendingJoin) {
        return;
      }
      log('debug', 'retrying buffered join');
      this.transport.sendToHost(this.pendingJoin);
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
  }

  /** Stop the client session */
  stop(): void {
    log('info', 'stopping client session');
    this.stopJoinRetries();
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
        log('debug', 'state updated to', message.state.phase);
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
  join(playerName: string): void {
    log('info', 'joining as', playerName);
    this.pendingJoin = { type: 'Join', name: playerName };
    this.transport.sendToHost(this.pendingJoin);
    // The first attempt may land before the host is reachable, so keep trying.
    this.startJoinRetries();
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

  /** Get the player ID assigned by the host */
  getPlayerId(): string | null {
    return this.playerId;
  }
}
