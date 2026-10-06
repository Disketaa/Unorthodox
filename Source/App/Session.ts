import { PlayerLook } from '@/Core';
import { PublicState, Pace } from '@/Game';

export type SessionRole = 'Host' | 'Player';

/** Why this player is not in the room, if they are not. */
export type BlockedReason = 'NameTaken' | 'AlreadyStarted' | 'RoomFull' | 'Kicked';

/** One API for the host and a client, so the UI can be written once. Methods a role does not
 * support are no-ops. */
export interface Session {
  readonly role: SessionRole;
  getPublicState(): PublicState | undefined;
  getPlayerId(): string | null;
  /** Skew between the host's clock and this device's, for counting phases down. */
  getClockOffsetMs(): number;
  onUpdate(listener: () => void): void;
  onHostLeave(listener: () => void): void;
  /** Why this player is not in the room, or undefined if they are in one. */
  getBlocked(): BlockedReason | undefined;
  /** How many players the room holds, for the refusal that says the room is full. The host's own
   * number: `App` may not read `GameConfig` for a client's state, and a refusal quoting a
   * different limit would be a number nobody can argue with. */
  getRoomLimit(): number;
  /** Only the host calls this. Removes a player from the room. */
  kick(playerId: string): void;
  join(name: string, look: PlayerLook): void;
  setLook(look: PlayerLook): void;
  /** The host setting the room's pace. Only the host calls this. A client pressing a pace button
   * is only looking at what it would mean, so this is a no-op there and the host's answer
   * arrives in the public state instead. */
  setPace(pace: Pace): void;
  /** Put an invented player in the room, for the host trying a room out alone. Only the host
   * calls this, and only while the console is on. The bot joins the roster like anyone else and
   * nobody is told: a client asking for a player to appear is not a thing. */
  addBot(): void;
  submitAnswer(text: string): void;
  rejectGroup(groupId: number): void;
  /** Give the room's turn to the next player in join order. Only the host calls this. */
  nextTurn(): void;
  startGame(topic: string, durationMs: number): void;
  closePhase(durationMs: number): void;
  startNextRound(topic: string, durationMs: number): void;
  finish(): void;
  stop(): void;
}
