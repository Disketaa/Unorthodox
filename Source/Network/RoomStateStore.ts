import type { HostState } from '@/Game';
import { clearCountIn } from './CountIn';
import { forgetHosting } from './RoomOwnership';
import { decodeRoomState, encodeRoomState } from './RoomStateCodec';

/**
 * The host's own game state, kept across closing the tab and coming back to it.
 *
 * A host who refreshes has not left the room, and neither has a host who closes the tab
 * and opens it again: without this, the room they come back to is a new one — a fresh
 * lobby with nobody in it and a round that never happened.
 *
 * In `localStorage` rather than `sessionStorage`, because the tab is gone by the time
 * anyone notices: what survives a refresh is per-tab, and this has to outlive more than
 * that. It is written under the room code, so it is one game's state and not one
 * browser's, and a room is left behind in exactly one way — by pressing exit, which
 * forgets it.
 */

/** Where a room's state is written, named after the room so two rooms cannot share it. */
const KeyPrefix = 'unorthodox.host.';

function keyFor(roomCode: string): string {
  return `${KeyPrefix}${roomCode}`;
}

/** A room with nobody in it, which is what a code this tab has never hosted means. */
export function freshLobby(): HostState {
  return {
    phase: 'Lobby',
    players: new Map(),
    cumulativeScores: new Map(),
    pace: 'Standard',
  };
}

/**
 * Write the room's state.
 *
 * Nothing here is worth breaking a round over: a tab with storage turned off plays on
 * exactly as before, it just cannot be refreshed back into the game it was in.
 */
export function saveRoomState(roomCode: string, state: HostState): void {
  try {
    localStorage.setItem(keyFor(roomCode), JSON.stringify(encodeRoomState(state)));
  } catch {
    // Private mode, or a quota, and the game goes on without a way back into itself.
  }
}

/** The room's state, or undefined if this tab has never hosted that room before. */
export function loadRoomState(roomCode: string): HostState | undefined {
  try {
    const stored = localStorage.getItem(keyFor(roomCode));
    return stored === null ? undefined : decodeRoomState(JSON.parse(stored));
  } catch {
    return undefined;
  }
}

/** Forget the room, which is what leaving it means. */
export function clearRoomState(roomCode: string): void {
  try {
    localStorage.removeItem(keyFor(roomCode));
  } catch {
    // Nothing to do: the state is already gone for this tab.
  }
}

/**
 * Forget everything this browser knows about a room, which is what leaving it means.
 *
 * One call because it is one event: the game is gone, the count-in it announced has
 * nothing left to announce, and this browser is no longer the host of a room that is
 * not there. Leaving any of it behind would let the next room under the same code find
 * a game that was abandoned rather than start as the new one it is.
 */
export function forgetRoom(roomCode: string): void {
  clearRoomState(roomCode);
  clearCountIn(roomCode);
  forgetHosting(roomCode);
}
