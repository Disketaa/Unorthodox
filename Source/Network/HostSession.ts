import { Transport } from './Transport';
import { isClientMessage, ClientMessage } from './Protocol';
import { HostRoster } from './HostRoster';
import { toAction } from './HostIncoming';
import { startGame, closeWriting, closeReviewing, nextRound } from './HostPhases';
import * as Game from '@/Game';
import { PlayerId, PlayerLook, createLogger } from '@/Core';

const log = createLogger('HostSession');

/** Reserved player id of the room creator. */
export const HostPlayerId: PlayerId = 'host';

export class HostSession {
  private state: Game.HostState | undefined = undefined;
  private transport: Transport;
  private readonly roster = new HostRoster();
  private updateListener: (() => void) | undefined = undefined;

  constructor(transport: Transport) {
    this.transport = transport;

    this.transport.onMessage((message, fromHost, peerId) => {
      log('debug', 'onMessage', message, 'from peer:', peerId);
      if (fromHost) {
        return;
      }
      if (!isClientMessage(message)) {
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

  start(roomCode: string, hostName: string, look: PlayerLook): void {
    log('info', 'starting host session', roomCode, hostName);
    // The state must exist before the room opens, because a waiting client can
    // answer the moment the host becomes addressable, and messages arriving
    // before the state is ready would be dropped.
    this.state = { phase: 'Lobby', players: new Map(), cumulativeScores: new Map() };
    // The host plays too, under the reserved `host` id.
    this.roster.addHost(HostPlayerId, hostName);
    this.apply({ type: 'JOIN', playerId: HostPlayerId, name: hostName, look });
    this.transport.setPlayerId(HostPlayerId);
    this.transport.start(roomCode, hostName, true);
    // Only the host is told about every peer, so presence is recorded here and
    // travels to the clients in the public state rather than being detected twice.
    this.transport.onPeerLeave((peerId) => this.markDeparted(peerId));
  }

  /**
   * Mark the player behind a departing peer as gone.
   *
   * The address is released first, because a peer that reconnects claims a fresh
   * address for the same seat, and the old one must not be able to mark them gone
   * a second time after they have already come back.
   *
   * Marking them gone also stops the room waiting on their answer: a dropped player
   * holds the round open otherwise, and nothing would ever close it.
   */
  private markDeparted(peerId: string): void {
    const playerId = this.roster.seatForPeer(peerId);
    this.roster.releasePeer(peerId);
    if (playerId === undefined) {
      log('warn', 'peer left without a seat', peerId);
      return;
    }
    log('info', 'player went offline', playerId);
    this.roster.markGone(playerId);
    this.apply({ type: 'SET_ONLINE', playerId, isOnline: false });
  }

  stop(): void {
    log('info', 'stopping host session');
    this.transport.stop();
    this.state = undefined;
    this.roster.clear();
    this.updateListener = undefined;
  }

  /** The peerId is the transport address the message arrived from, not a player id. */
  private handleClientMessage(message: ClientMessage, peerId: string): void {
    if (!this.state) {
      return;
    }
    if (message.type === 'Sync') {
      // A client that was away asks for the current state, which carries the
      // phase start time so it resumes counting from the truth.
      log('debug', 'resending state to peer', peerId);
      this.broadcastState();
      return;
    }
    const action = toAction({
      message,
      peerId,
      roster: this.roster,
      transport: this.transport,
      state: this.state,
    });
    if (action) {
      this.apply(action);
    }
  }

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

  startGame(topic: string, durationMs: number): void {
    this.commit(startGame(this.state, topic, durationMs));
  }

  /**
   * Advance out of the Writing phase once everyone has answered, or out of the
   * Reviewing phase (once reviewing time is up, going to Scores).
   */
  endReviewing(durationMs: number): void {
    const next =
      this.state?.phase === 'Writing'
        ? closeWriting(this.state, durationMs, this.roster.count)
        : closeReviewing(this.state, durationMs);
    this.commit(next);
  }

  nextRound(topic: string, durationMs: number): void {
    this.commit(nextRound(this.state, topic, durationMs));
  }

  /** Submit the host's own answer, so the host plays the same way as everyone else. */
  submitOwnAnswer(text: string): void {
    this.apply({ type: 'SUBMIT_ANSWER', playerId: HostPlayerId, text });
  }

  /** The host changing its own character, as the lobby allows until play starts. */
  setOwnLook(look: PlayerLook): void {
    this.apply({ type: 'SET_LOOK', playerId: HostPlayerId, look });
  }

  /**
 * Remove a player from the room at the host's word.
 *
 * The address is released before the seat, so that a player who walks out of their
 * own kicked session is not then reported as one more dropout by a host that has
 * already forgotten they were here.
 */
  kick(playerId: PlayerId): void {
    const address = this.roster.addressForSeat(playerId);
    if (address !== undefined) {
      this.transport.sendToPeer(address, { type: 'Kicked' });
      this.roster.releasePeer(address);
    }
    this.roster.releaseSeat(playerId);
    log('info', 'kicking player', playerId);
    this.apply({ type: 'KICK', playerId });
  }

  rejectOwnGroup(groupId: number): void {
    this.apply({ type: 'REJECT_GROUP', playerId: HostPlayerId, groupId });
  }

  finish(): void {
    this.apply({ type: 'FINAL' });
  }

  private commit(next: Game.HostState): void {
    this.state = next;
    this.broadcastState();
    this.updateListener?.();
  }

  private apply(action: Game.GameAction): void {
    log('debug', 'reducing action', action.type);
    this.commit(Game.reducer(this.state, action));
  }

  /**
   * The host's own state, every answer in it. Never sent to a client: what
   * leaves the host goes through `toPublicState`, which drops the answers.
   */
  getState(): Game.HostState | undefined {
    return this.state;
  }
}
