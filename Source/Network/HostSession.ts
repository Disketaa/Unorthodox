import { Transport } from './Transport';
import { isClientMessage, ClientMessage } from './Protocol';
import * as Game from '@/Game';
import { PlayerId, createLogger } from '@/Core';

const log = createLogger('HostSession');

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

  constructor(transport: Transport) {
    this.transport = transport;

    // Set up incoming message handler
    this.transport.onMessage((message, fromHost) => {
      log('debug', 'onMessage', message, 'fromHost:', fromHost);
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
      this.handleClientMessage(message);
    });
  }

  /** Start the host session with a room code and host name */
  start(roomCode: string, hostName: string): void {
    log('info', 'starting host session', roomCode, hostName);
    this.transport.start(roomCode, hostName, true);
    // Set the host's playerId (special value)
    this.transport.setPlayerId('host');
    // Initialize state to lobby with no players
    this.state = {
      phase: 'Lobby',
      players: new Map(),
      cumulativeScores: new Map(),
    };
    // Note: we are not adding the host as a player. This is a known limitation.
  }

  /** Stop the host session */
  stop(): void {
    log('info', 'stopping host session');
    this.transport.stop();
    this.state = undefined;
    this.playerIds.clear();
  }

  /** Handle a message from a client */
  private handleClientMessage(message: ClientMessage): void {
    if (!this.state) {
      return;
    }
    let action: Game.GameAction | null = null;
    switch (message.type) {
      case 'Join': {
        const playerId: PlayerId = `p${this.nextPlayerId++}`;
        this.playerIds.add(playerId);
        action = { type: 'JOIN', playerId, name: message.name };
        // Address the client by the temporary id it gave us until it learns its real one.
        log('info', 'assigning playerId', playerId, 'to', message.temporaryClientId);
        this.transport.sendToPlayer(message.temporaryClientId, { type: 'SetPlayerId', playerId });
        break;
      }
      case 'SubmitAnswer':
        action = { type: 'SUBMIT_ANSWER', playerId: message.playerId, text: message.text };
        break;
      case 'RejectGroup':
        action = { type: 'REJECT_GROUP', playerId: message.playerId, groupId: message.groupId };
        break;
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
    this.transport.broadcast({ type: 'State', state: publicState });
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

  /**
   * Advance out of the Writing phase once everyone has answered, or out of the
   * Reviewing phase (once reviewing time is up, going to Scores).
   */
  endReviewing(durationMs: number): void {
    if (!this.state) {
      return;
    }
    if (this.state.phase === 'Writing') {
      if (this.state.answers.size < this.playerIds.size) {
        log('debug', 'waiting for answers', this.state.answers.size, 'of', this.playerIds.size);
        return;
      }
      this.apply({
        type: 'START_REVIEWING',
        startedAt: Date.now(),
        durationMs,
      });
      return;
    }
    if (this.state.phase === 'Reviewing') {
      this.apply({
        type: 'END_REVIEWING',
        startedAt: Date.now(),
        durationMs,
      });
    }
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

  /** Reduce an action into the host state and broadcast the result */
  private apply(action: Game.GameAction): void {
    log('debug', 'reducing action', action.type);
    this.state = Game.reducer(this.state, action);
    this.broadcastState();
  }

  /** Get the current host state (for debugging) */
  getState(): Game.HostState | undefined {
    return this.state;
  }
}
