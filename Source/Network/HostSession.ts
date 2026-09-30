import { Transport } from './Transport';
import { isClientMessage, ClientMessage } from './Protocol';
import * as Game from '@/Game';
import { PlayerId, createLogger } from '@/Core';

const log = createLogger('HostSession');

/** Reserved player id of the room creator. */
export const HostPlayerId: PlayerId = 'host';

/**
 * Manages the host side of the game state and communication.
 */
export class HostSession {
  private state: Game.HostState | undefined = undefined;
  private transport: Transport;
  private nextPlayerId = 1; // Simple counter for generating player IDs
  // Roster of joined player ids. The game state only carries `players` in the
  // Lobby phase, so we track it here to know when everyone has answered.
  private readonly playerIds = new Set<PlayerId>();
  private updateListener: (() => void) | undefined = undefined;

  constructor(transport: Transport) {
    this.transport = transport;

    // Set up incoming message handler
    this.transport.onMessage((message, fromHost, peerId) => {
      log('debug', 'onMessage', message, 'from peer:', peerId);
      // We only expect messages from clients (fromHost should be false)
      if (fromHost) {
        // Ignore messages from host (shouldn't happen in a correct setup)
        return;
      }
      if (!isClientMessage(message)) {
        // Invalid message, ignore
        log('warn', 'ignoring unrecognised client message');
        return;
      }
      this.handleClientMessage(message, peerId);
    });
  }

  /** Subscribe to state changes so the UI can re-render. */
  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  /** Start the host session with a room code and host name */
  start(roomCode: string, hostName: string): void {
    log('info', 'starting host session', roomCode, hostName);
    // The state must exist before the room opens, because a waiting client can
    // answer the moment the host becomes addressable, and messages arriving
    // before the state is ready would be dropped.
    this.state = { phase: 'Lobby', players: new Map(), cumulativeScores: new Map() };
    // The host plays too, under the reserved `host` id.
    this.playerIds.add(HostPlayerId);
    this.apply({ type: 'JOIN', playerId: HostPlayerId, name: hostName });
    this.transport.setPlayerId(HostPlayerId);
    this.transport.start(roomCode, hostName, true);
  }

  /** Stop the host session */
  stop(): void {
    log('info', 'stopping host session');
    this.transport.stop();
    this.state = undefined;
    this.playerIds.clear();
    this.updateListener = undefined;
  }

  /** Handle a message from a client, addressed by the peer it arrived from. */
  private handleClientMessage(message: ClientMessage, peerId: string): void {
    if (!this.state) {
      return;
    }
    let action: Game.GameAction | null = null;
    switch (message.type) {
      case 'Join': {
        const playerId: PlayerId = `p${this.nextPlayerId++}`;
        this.playerIds.add(playerId);
        action = { type: 'JOIN', playerId, name: message.name };
        // Answer the peer the message came from: the game player id is assigned
        // here and never reaches the wire, so it is not routable.
        log('info', 'assigning playerId', playerId, 'to peer', peerId);
        this.transport.sendToPeer(peerId, { type: 'SetPlayerId', playerId });
        break;
      }
      case 'SubmitAnswer':
        action = { type: 'SUBMIT_ANSWER', playerId: message.playerId, text: message.text };
        break;
      case 'RejectGroup':
        action = { type: 'REJECT_GROUP', playerId: message.playerId, groupId: message.groupId };
        break;
      case 'Sync':
        // A client that was away asks for the current state, which carries the
        // phase start time so it resumes counting from the truth.
        log('debug', 'resending state to peer', peerId);
        this.broadcastState();
        return;
    }
    if (action) {
      this.apply(action);
    }
  }

  /** Broadcast the current public state to all clients */
  private broadcastState(): void {
    if (!this.state) {
      return;
    }
    const publicState = Game.toPublicState(this.state);
    log('debug', 'broadcasting', publicState.phase);
    // The host's own clock travels with the state so each client can measure
    // the skew and count the phase down from when it really started.
    this.transport.broadcast({ type: 'State', state: publicState, hostNow: Date.now() });
  }

  /** Call this to start the game (host presses start button) */
  startGame(topic: string, durationMs: number): void {
    if (!this.state || this.state.phase !== 'Lobby') {
      return;
    }
    log('info', 'starting game', topic, durationMs);
    this.apply({
      type: 'START_GAME',
      topic,
      durationMs,
      startedAt: Date.now(), // Note: we should use performance.now() but for simplicity we use Date.now()
    });
  }

  /** Close the writing phase into Reviewing, once everyone has answered. */
  private closeWriting(durationMs: number): void {
    if (this.state === undefined || this.state.phase !== 'Writing') {
      return;
    }
    if (this.state.answers.size < this.playerIds.size) {
      log('debug', 'waiting for answers', this.state.answers.size, 'of', this.playerIds.size);
      return;
    }
    this.apply({ type: 'START_REVIEWING', startedAt: Date.now(), durationMs });
  }

  /** Close the reviewing phase into Scores. */
  private closeReviewing(durationMs: number): void {
    if (this.state === undefined || this.state.phase !== 'Reviewing') {
      return;
    }
    this.apply({ type: 'END_REVIEWING', startedAt: Date.now(), durationMs });
  }

  /**
   * Advance out of the Writing phase once everyone has answered, or out of the
   * Reviewing phase (once reviewing time is up, going to Scores).
   */
  endReviewing(durationMs: number): void {
    if (this.state?.phase === 'Writing') {
      this.closeWriting(durationMs);
      return;
    }
    this.closeReviewing(durationMs);
  }

  /** Call this to go to the next round (after scores screen) */
  nextRound(topic: string, durationMs: number): void {
    if (!this.state || (this.state.phase !== 'Scores' && this.state.phase !== 'Reviewing')) {
      return;
    }
    log('info', 'starting next round', topic);
    this.apply({
      type: 'NEXT_ROUND',
      topic,
      durationMs,
      startedAt: Date.now(),
    });
  }

  /** Submit the host's own answer, so the host plays the same way as everyone else. */
  submitOwnAnswer(text: string): void {
    this.apply({ type: 'SUBMIT_ANSWER', playerId: HostPlayerId, text });
  }

  /** The host's own rejection vote on an answer group. */
  rejectOwnGroup(groupId: number): void {
    this.apply({ type: 'REJECT_GROUP', playerId: HostPlayerId, groupId });
  }

  /** Close the game and show the final ranking. */
  finish(): void {
    this.apply({ type: 'FINAL' });
  }  /** Reduce an action into the host state and broadcast the result */
  private apply(action: Game.GameAction): void {
    log('debug', 'reducing action', action.type);
    this.state = Game.reducer(this.state, action);
    this.broadcastState();
    this.updateListener?.();
  }

  /** Get the current host state (for debugging) */
  getState(): Game.HostState | undefined {
    return this.state;
  }
}
