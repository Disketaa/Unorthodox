import { Transport } from './Transport';
import { isHostMessage, HostMessage } from './Protocol';
import * as Game from '@/Game';
import { createLogger } from '@/Core';

const log = createLogger('ClientSession');

/**
 * Manages the client side of the game state and communication.
 */
export class ClientSession {
  private state: Game.PublicState | undefined = undefined;
  private transport: Transport;
  private playerId: string | null = null; // We'll set this when we receive a SetPlayerId message from the host
  private temporaryClientId: string; // Temporary client ID used until we get the real one from the host
  private updateListener: (() => void) | undefined = undefined;

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
    // Generate a temporary client ID
    this.temporaryClientId =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
    // Set our temporary client ID on the transport so that the host can send messages to us using this ID
    this.transport.setPlayerId(this.temporaryClientId);
    this.transport.start(roomCode, playerName, false);
    // We don't know our playerId yet; the host will assign it via SetPlayerId message
  }

  /** Stop the client session */
  stop(): void {
    log('info', 'stopping client session');
    this.transport.stop();
    this.state = undefined;
    this.playerId = null;
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
        this.updateListener?.();
        // Re-key the transport from the temporary id to the real player id, so the
        // host can address us by the id it now knows us by.
        this.transport.setPlayerId(message.playerId);
        break;
    }
  }

  /** Send a join message to the host */
  join(playerName: string): void {
    log('info', 'joining as', playerName);
    this.transport.sendToHost({ type: 'Join', name: playerName, temporaryClientId: this.temporaryClientId });
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
