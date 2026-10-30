import { reportCommit, reportCommitAt, reportPhase } from '@/Core';
import { Transport } from './Transport';
import { HostInbox } from './HostInbox';
import { hostFlowMoves, type HostFlowMoves } from './HostFlowMoves';
import type { FlowHost } from './HostFlow';
import { addBot, kick, nextTurn, setOwnLook, setPace, setThemes } from './HostRosterActions';
import { answerBots } from './HostBots';
import { openHostRoom, type HostRoomOpener } from './HostRoomOpen';
import { HostRoom } from './HostRoom';
import * as Game from '@/Game';
import { PlayerId, PlayerLook, ThemeId, ThemeMode, CustomTheme, createLogger } from '@/Core';
const log = createLogger('HostSession');
export const HostPlayerId: PlayerId = 'host';
export class HostSession implements HostFlowMoves, HostRoomOpener {
  /** The room this session is hosting: its state, its roster, and the wire it is on. */
  readonly room: HostRoom;
  private readonly inbox: HostInbox;
  /** The room's own moves between phases, written down once in `HostFlowMoves`. */
  private readonly moves: HostFlowMoves;
  private botsAdded = 0;
  private roomCode = '';
  constructor(transport: Transport) {
    this.room = new HostRoom(transport);
    this.inbox = new HostInbox(transport, this.room, (action) => this.apply(action));
    this.moves = hostFlowMoves(
      () => this.flow,
      () => this.roomCode,
      HostPlayerId
    );
    this.inbox.listen();
  }
  botsRestored(count: number): void {
    this.botsAdded = count;
  }
  start(roomCode: string, hostName: string, look: PlayerLook): void {
    log('info', 'starting host session', roomCode, hostName);
    this.roomCode = roomCode;
    openHostRoom(this, roomCode, hostName, look, HostPlayerId);
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
    // Report the new phase BEFORE commit: commit triggers the Preact re-render, and the
    // render counter reads sink.phase during that render. Calling it after would bucket
    // every render under the previous phase.
    reportPhase(state.phase);
    this.room.commit(state);
    answerBots(this);
    reportCommit();
    reportCommitAt(state.phase, performance.now());
  }
  submitOwnAnswer(text: string): void {
    this.apply({ type: 'SUBMIT_ANSWER', playerId: HostPlayerId, text, at: Date.now() });
  }
  setOwnEditingAnswer(editing: boolean): void {
    this.apply({ type: 'EDITING_ANSWER', playerId: HostPlayerId, editing });
  }
  chooseTheme(theme: ThemeId): void {
    this.moves.chooseTheme(theme);
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
    this.moves.startGame();
  }
  startWriting(topic: string): void {
    this.moves.startWriting(topic);
  }
  revealQuestion(question: string): void {
    this.moves.revealQuestion(question);
  }
  startRandomPick(): void {
    this.moves.startRandomPick();
  }
  resolveRandomPick(): void {
    this.moves.resolveRandomPick();
  }
  setPaused(paused: boolean): void {
    this.moves.setPaused(paused);
  }
  endReviewing(): void {
    this.moves.endReviewing();
  }
  nextRound(): void {
    this.moves.nextRound();
  }
  nextPhase(topic: string): void {
    this.moves.nextPhase(topic);
  }
  reloadPhase(): void {
    this.moves.reloadPhase();
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
