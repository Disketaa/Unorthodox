import { Transport } from './Transport';
import { HostInbox } from './HostInbox';
import {
  startGameFrom,
  startWritingFrom,
  revealQuestionFrom,
  startRandomPickFrom,
  resolveRandomPickFrom,
  setPausedFrom,
  endReviewingFrom,
  nextRoundFrom,
  nextPhaseFrom,
  type FlowHost,
} from './HostFlow';
import { addBot, countBots, kick, nextTurn, setOwnLook, setPace } from './HostRosterActions';
import { departureOf } from './HostPresence';
import { freshLobby } from './RoomStateStore';
import { HostRoom } from './HostRoom';
import * as Game from '@/Game';
import { PlayerId, PlayerLook, ThemeId, createLogger } from '@/Core';

const log = createLogger('HostSession');

/** Reserved player id of the room creator. */
export const HostPlayerId: PlayerId = 'host';

/** The room, as the app talks to it: the host's own browser, holding the state, the seats and
 * the wire. Everything it can be asked to do is here; how a message, a phase move or a seating
 * move is worked out lives in `HostInbox`, `HostFlow` and `HostRosterActions`. */
export class HostSession {
  private readonly room: HostRoom;
  private readonly inbox: HostInbox;
  /** How many bots this room has been given, which is how the next one is numbered. */
  private botsAdded = 0;
  /** The code the room's themes are dealt from, kept because the bank is rolled from it and
   * nothing else in the host's state carries it. */
  private roomCode = '';

  constructor(transport: Transport) {
    this.room = new HostRoom(transport);
    this.inbox = new HostInbox(transport, this.room, (action) => this.apply(action));
    this.inbox.listen();
  }

  /** Open the room, picking up the game this tab was already running. A refreshing host has not
   * left, so a fresh lobby would be a different room with the same code. */
  start(roomCode: string, hostName: string, look: PlayerLook): void {
    log('info', 'starting host session', roomCode, hostName);
    this.roomCode = roomCode;
    // The state must exist before the room opens, because a waiting client can answer the
    // moment the host becomes addressable, and messages arriving before the state is ready
    // would be dropped.
    const restored = this.room.open(roomCode) ?? freshLobby();
    this.room.commit(restored);
    // The host plays too, under the reserved `host` id.
    this.room.roster.addHost(HostPlayerId, hostName);
    // A resumed roster comes back as seats, not as connections: this tab was hosting that
    // game a moment ago, and every player in it is somebody it was already waiting on.
    this.room.roster.restore([...restored.players.entries()]);
    this.apply({ type: 'JOIN', playerId: HostPlayerId, name: hostName, look });
    // The bots in a resumed room keep their seats: counting what is already there is what
    // stops the next bot being handed a seat that is taken.
    this.botsAdded = countBots(restored);
    this.transport.setPlayerId(HostPlayerId);
    this.transport.start(roomCode, hostName, true);
    // Only the host is told about every peer, so presence is recorded here and travels to the
    // clients in the public state rather than being detected twice.
    this.transport.onPeerLeave((peerId) => {
      const departure = departureOf(peerId, this.room.roster);
      if (departure !== undefined) this.apply(departure);
    });
  }

  stop(): void {
    log('info', 'stopping host session');
    this.room.close();
    this.transport.stop();
    this.botsAdded = 0;
  }

  /** What the phase flow reads and writes, so the flow needs no reference back to this class. */
  private get flow(): FlowHost {
    return {
      getState: () => this.room.getState(),
      expectedAnswers: () => this.room.roster.count,
      commit: (state) => this.room.commit(state),
    };
  }

  apply(action: Game.GameAction): void {
    log('debug', 'reducing action', action.type);
    this.room.apply(action, Game.reducer);
  }

  /** Submit the host's own answer, so the host plays the same way as everyone else. */
  submitOwnAnswer(text: string): void {
    this.apply({ type: 'SUBMIT_ANSWER', playerId: HostPlayerId, text });
  }

  /** The host writing over its own sent answer, under the reserved id. */
  setOwnEditingAnswer(editing: boolean): void {
    this.apply({ type: 'EDITING_ANSWER', playerId: HostPlayerId, editing });
  }

  /** The host answering the bank from their own seat. Under the reserved id, like every other
   * move the host makes about itself, so it is refused when it is not their turn like anybody
   * else's. */
  chooseTheme(theme: ThemeId): void {
    this.apply({ type: 'CHOOSE_THEME', playerId: HostPlayerId, theme, at: Date.now() });
  }

  rejectOwnGroup(groupId: number): void {
    this.apply({ type: 'REJECT_GROUP', playerId: HostPlayerId, groupId });
  }

  setOwnLook(look: PlayerLook): void {
    setOwnLook(this, look);
  }

  setPace(pace: Game.Pace): void {
    setPace(this, pace);
  }

  addBot(): void {
    addBot(this);
  }

  kick(playerId: PlayerId): void {
    kick(this, playerId);
  }

  nextTurn(): void {
    nextTurn(this);
  }

  finish(): void {
    this.apply({ type: 'FINAL' });
  }

  startGame(): void {
    startGameFrom(this.flow);
  }

  startWriting(topic: string): void {
    startWritingFrom(this.flow, topic);
  }

  revealQuestion(question: string): void {
    revealQuestionFrom(this.flow, question);
  }

  /** The bank closed with nothing pressed on it, so the room is answering its own. */
  startRandomPick(): void {
    startRandomPickFrom(this.flow, this.roomCode);
  }

  /** The sweep is over and the roll commits. */
  resolveRandomPick(): void {
    resolveRandomPickFrom(this.flow);
  }

  /** Holding the room still, or letting it run again. */
  setPaused(paused: boolean): void {
    setPausedFrom(this.flow, paused);
  }

  /** Advance out of Writing once everyone has answered, or out of Reviewing once its clock is
   * up. */
  endReviewing(durationMs: number): void {
    endReviewingFrom(this.flow, durationMs);
  }

  /** Into the next round's theme choice. No topic: Choosing has none, and the round that follows
   * is given its topic when the theme is picked. */
  nextRound(): void {
    nextRoundFrom(this.flow);
  }

  /** Wherever the phase table says goes next. */
  nextPhase(topic: string): void {
    nextPhaseFrom(this.flow, topic);
  }

  get roster() {
    return this.room.roster;
  }

  get transport(): Transport {
    return this.room.wire;
  }

  botCount(): number {
    return this.botsAdded;
  }

  countBot(): void {
    this.botsAdded += 1;
  }

  onUpdate(listener: () => void): void {
    this.room.onUpdate(listener);
  }

  /** The host's own state, every answer in it. Never sent to a client: what leaves the host goes
   * through `toPublicState`, which drops the answers. */
  getState(): Game.HostState | undefined {
    return this.room.getState();
  }
}
