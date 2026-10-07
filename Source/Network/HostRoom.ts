/** The room as the host holds it: the state, the seats, and where it is written down. Every
 * write does the same three things in order — reduce, store, tell everybody — which is what
 * stops a new move from writing state the clients never hear about. */
import type { GameAction, HostState } from '@/Game';
import { HostRoster } from './HostRoster';
import { publishPublicState } from './HostOutgoing';
import { forgetRoom, loadRoomState, saveRoomState } from './RoomStateStore';
import type { Transport } from './Transport';

export class HostRoom {
  private state: HostState | undefined = undefined;
  private readonly seats = new HostRoster();
  /** The room this is holding, which is also where its state is written. */
  private roomCode: string | undefined = undefined;
  private updateListener: (() => void) | undefined = undefined;

  constructor(readonly wire: Transport) {}

  /** Open a room, picking up the game this tab was already running. A refreshing host has not
   * left, so a fresh lobby would be a different room with the same code, and everybody in it
   * would be waiting on a host that no longer exists. */
  open(roomCode: string): HostState | undefined {
    this.roomCode = roomCode;
    this.state = loadRoomState(roomCode);
    return this.state;
  }

  /** Subscribe to state changes so the UI can re-render. */
  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  /** Leave the room for good, rather than refreshing it, so the game this tab was running is
   * forgotten: opening the same code again is a new room, not a return. */
  close(): void {
    if (this.roomCode !== undefined) forgetRoom(this.roomCode);
    this.state = undefined;
    this.seats.clear();
    this.updateListener = undefined;
    this.roomCode = undefined;
  }

  getState(): HostState | undefined {
    return this.state;
  }

  get roster(): HostRoster {
    return this.seats;
  }

  /** Reduce an action and put the result where everybody can see it. Nothing to reduce into
   * before the room is opened, so a message that arrives first is dropped rather than founding
   * a room nobody asked for. */
  apply(action: GameAction, reduce: (state: HostState, action: GameAction) => HostState): void {
    const state = this.state;
    if (state === undefined) {
      return;
    }
    this.commit(reduce(state, action));
  }

  /** Put a state the flow has already built. The only way in that is not an action, so a phase
   * move the flow made and one the reducer made reach the clients by the same path. */
  commit(next: HostState): void {
    this.state = next;
    // Written on every change rather than on the way out, because a refresh never runs
    // the way out: the tab is gone, and this is what the room comes back to.
    if (this.roomCode !== undefined) {
      saveRoomState(this.roomCode, next);
    }
    this.broadcastState();
    this.updateListener?.();
  }

  /** Tell every client the room as it stands. Answers are dropped on the way out by
   * `toPublicState`, so what leaves the host is only what a client is allowed to see. */
  broadcastState(): void {
    if (this.state !== undefined) {
      publishPublicState(this.state, this.wire);
    }
  }
}
