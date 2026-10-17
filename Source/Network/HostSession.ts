import { Transport } from './Transport';
import { HostInbox } from './HostInbox';
import {
  startGameFrom,
  startWritingFrom,
  revealQuestionFrom,
  startRandomPickFrom,
  resolveRandomPickFrom,
  chooseThemeFrom,
  setPausedFrom,
  endReviewingFrom,
  nextRoundFrom,
  nextPhaseFrom,
  type FlowHost,
} from './HostFlow';
import {
  addBot,
  countBots,
  kick,
  nextTurn,
  setOwnLook,
  setPace,
  setThemes,
} from './HostRosterActions';
import { answerBots } from './HostBots';
import { departureOf } from './HostPresence';
import { freshLobby } from './RoomStateStore';
import { HostRoom } from './HostRoom';
import * as Game from '@/Game';
import {
  PlayerId,
  PlayerLook,
  ThemeId,
  ThemeMode,
  CustomTheme,
  savedCustomThemes,
  createLogger,
} from '@/Core';
const log = createLogger('HostSession');
export const HostPlayerId: PlayerId = 'host';
export class HostSession {
  private readonly room: HostRoom;
  private readonly inbox: HostInbox;
  private botsAdded = 0;
  private roomCode = '';
  constructor(transport: Transport) {
    this.room = new HostRoom(transport);
    this.inbox = new HostInbox(transport, this.room, (action) => this.apply(action));
    this.inbox.listen();
  }
  start(roomCode: string, hostName: string, look: PlayerLook): void {
    log('info', 'starting host session', roomCode, hostName);
    this.roomCode = roomCode;
    const restored = this.room.open(roomCode) ?? freshLobby();
    this.room.commit(restored);
    // This browser's own custom themes into the room it is hosting. They were written down when
    // they were pasted, so a host has them whether this room was just opened or was restored from
    // storage — and a room only deals out of the themes it holds, so without this the host's
    // pasted themes sat in the lobby's grid and never in a bank.
    const known = [...(restored.customThemes?.values() ?? []), ...savedCustomThemes()];
    if (known.length > 0)
      this.room.commit({ ...restored, customThemes: new Map(known.map((t) => [t.name, t])) });
    this.room.roster.addHost(HostPlayerId, hostName);
    this.room.roster.restore([...restored.players.entries()]);
    this.apply({ type: 'JOIN', playerId: HostPlayerId, name: hostName, look });
    this.botsAdded = countBots(restored);
    this.transport.setPlayerId(HostPlayerId);
    this.transport.start(roomCode, hostName, true);
    this.transport.onPeerLeave((peerId) => {
      const departure = departureOf(peerId, this.room.roster);
      if (departure !== undefined) this.apply(departure);
    });
  }
  stop(): void {
    log('info', 'stopping host session');
    this.room.close();
    this.transport.stop();
  }
  private get flow(): FlowHost {
    return {
      getState: () => this.room.getState(),
      expectedAnswers: () => this.room.roster.count,
      commit: (state) => this.write(state),
    };
  }
  apply(action: Game.GameAction): void {
    log('debug', 'reducing action', action.type);
    this.room.apply(action, Game.reducer);
    answerBots(this);
  }
  private write(state: Game.HostState): void {
    this.room.commit(state);
    answerBots(this);
  }
  submitOwnAnswer(text: string): void {
    this.apply({ type: 'SUBMIT_ANSWER', playerId: HostPlayerId, text });
  }
  setOwnEditingAnswer(editing: boolean): void {
    this.apply({ type: 'EDITING_ANSWER', playerId: HostPlayerId, editing });
  }
  chooseTheme(theme: ThemeId): void {
    chooseThemeFrom(this.flow, this.roomCode, theme, HostPlayerId);
  }
  rejectOwnGroup(groupId: number): void {
    this.apply({ type: 'REJECT_GROUP', playerId: HostPlayerId, groupId });
  }
  likeOwnGroup(groupId: number): void {
    this.apply({ type: 'LIKE_GROUP', playerId: HostPlayerId, groupId });
  }
  setOwnLook = (look: PlayerLook): void => setOwnLook(this, look);
  setPace = (pace: Game.Pace): void => setPace(this, pace);
  setThemes = (mode: ThemeMode, themes: readonly ThemeId[]): void =>
    setThemes(this, mode, themes);
  setCustomThemes = (themes: readonly CustomTheme[]): void =>
    this.apply({ type: 'SET_CUSTOM_THEMES', themes });
  removeCustomTheme = (name: string): void => this.apply({ type: 'REMOVE_CUSTOM_THEME', name });
  getCustomThemes(): readonly CustomTheme[] {
    const state = this.room.getState();
    return state === undefined || state.customThemes === undefined
      ? []
      : [...state.customThemes.values()];
  }
  addBot = (): void => addBot(this);
  kick = (playerId: PlayerId): void => kick(this, playerId);
  nextTurn = (): void => nextTurn(this);
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
  startRandomPick(): void {
    startRandomPickFrom(this.flow, this.roomCode);
  }
  resolveRandomPick(): void {
    resolveRandomPickFrom(this.flow, this.roomCode);
  }
  setPaused(paused: boolean): void {
    setPausedFrom(this.flow, paused);
  }
  endReviewing(durationMs: number): void {
    endReviewingFrom(this.flow, durationMs);
  }
  nextRound(): void {
    nextRoundFrom(this.flow);
  }
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
  getState(): Game.HostState | undefined {
    return this.room.getState();
  }
}
