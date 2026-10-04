import { Transport } from './Transport';
import { isClientMessage, ClientMessage } from './Protocol';
import { HostRoster } from './HostRoster';
import { toAction } from './HostIncoming';
import { startGame, closeWriting, closeReviewing, nextRound } from './HostPhases';
import { botJoin, botsIn } from './Bot';
import { departureOf } from './HostPresence';
import { publishPublicState } from './HostOutgoing';
import { forgetRoom, freshLobby, loadRoomState, saveRoomState } from './RoomStateStore';
import * as Game from '@/Game';
import { PlayerId, PlayerLook, createLogger } from '@/Core';

const log = createLogger('HostSession');

/** Reserved player id of the room creator. */
export const HostPlayerId: PlayerId = 'host';

/** A room with nobody in it, which is what a code this tab has never hosted means. */

export class HostSession {
  private state: Game.HostState | undefined = undefined;
  private transport: Transport;
  private readonly roster = new HostRoster();
  private updateListener: (() => void) | undefined = undefined;
  /** How many bots this room has been given, which is how the next one is numbered. */
  private botsAdded = 0;
  /** The room this session is hosting, which is also where its state is written. */
  private roomCode: string | undefined = undefined;

  constructor(transport: Transport) {
    this.transport = transport;

    this.transport.onMessage((message, fromHost, peerId) => {
      log('debug', 'onMessage', message, 'from peer:', peerId);
      if (fromHost) return;
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

  /**
   * Open the room, picking up the game this tab was already running.
   *
   * A host who refreshes has not left, so the state comes back from where it was last written
   * rather than from nothing: a fresh lobby here would be a different room with the same code,
   * and everybody still in it would be waiting on a host that no longer exists.
   */
  start(roomCode: string, hostName: string, look: PlayerLook): void {
    log('info', 'starting host session', roomCode, hostName);
    this.roomCode = roomCode;
    // The state must exist before the room opens, because a waiting client can
    // answer the moment the host becomes addressable, and messages arriving
    // before the state is ready would be dropped.
    this.state = loadRoomState(roomCode) ?? freshLobby();
    // The host plays too, under the reserved `host` id.
    this.roster.addHost(HostPlayerId, hostName);
    // The roster of the resumed room comes back as a set of seats, not as a set of
    // connections: this tab was hosting that game a moment ago, and every player in it
    // is somebody it was already waiting on.
    this.roster.restore([...this.state.players.entries()]);
    this.apply({ type: 'JOIN', playerId: HostPlayerId, name: hostName, look });
    // The bots in a resumed room keep their seats: counting what is already there is
    // what stops the next bot being handed a seat that is taken.
    this.botsAdded = botsIn(this.state);
    this.transport.setPlayerId(HostPlayerId);
    this.transport.start(roomCode, hostName, true);
    // Only the host is told about every peer, so presence is recorded here and
    // travels to the clients in the public state rather than being detected twice.
    this.transport.onPeerLeave((peerId) => {
      const departure = departureOf(peerId, this.roster);
      if (departure !== undefined) this.apply(departure);
    });
  }

  stop(): void {
    log('info', 'stopping host session');
    // Leaving the room for good, rather than refreshing it, so the game this tab was
    // running is forgotten: opening the same code again is a new room, not a return.
    if (this.roomCode !== undefined) forgetRoom(this.roomCode);
    this.transport.stop();
    this.state = undefined;
    this.roster.clear();
    this.updateListener = undefined;
    this.botsAdded = 0;
    this.roomCode = undefined;
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
    if (this.state) {
      publishPublicState(this.state, this.transport);
    }
  }

  startGame(topic: string, durationMs: number): void {
    this.commit(startGame(this.state, topic, durationMs));
  }

  /** Advance out of the Writing phase once everyone has answered, or out of the Reviewing phase (once reviewing time is up, going to Scores). */
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

  /** The host setting how fast the room plays, which every client is then told. */
  setPace(pace: Game.Pace): void {
    this.apply({ type: 'SET_PACE', pace });
  }

  /**
   * Put an invented player in the room, for the host trying a full room alone.
   *
   * A join like any other, so the bot is in the roster and can be voted for and kicked. It is
   * given a seat of its own rather than claimed from the roster, because there is no address
   * behind it and nothing to go offline, which also keeps the room from waiting on an answer
   * that will not be written.
   */
  addBot(): void {
    if (!this.state) return;
    const action = botJoin(this.state, this.botsAdded + 1, Math.random);
    if (action) {
      this.botsAdded += 1;
      this.apply(action);
    }
  }

  /**
   * Remove a player from the room at the host's word.
   *
   * The address is released before the seat, so that a player who walks out of their own kicked
   * session is not then reported as one more dropout by a host that has already forgotten they
   * were here.
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

  private apply(action: Game.GameAction): void {
    log('debug', 'reducing action', action.type);
    this.commit(Game.reducer(this.state, action));
  }

  private commit(next: Game.HostState): void {
    this.state = next;
    // Written on every change rather than on the way out, because a refresh never runs
    // the way out: the tab is gone, and this is what the room comes back to.
    if (this.roomCode !== undefined) {
      saveRoomState(this.roomCode, next);
    }
    this.broadcastState();
    this.updateListener?.();
  }

  /** The host's own state, every answer in it. Never sent to a client: what leaves the host goes through `toPublicState`, which drops the answers. */
  getState(): Game.HostState | undefined {
    return this.state;
  }
}
