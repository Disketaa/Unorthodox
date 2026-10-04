import { PlayerLook } from '@/Core';
import { PublicState, Pace } from '@/Game';

export type SessionRole = 'Host' | 'Player';

/** Why this player is not in the room, if they are not. */
export type BlockedReason = 'NameTaken' | 'AlreadyStarted' | 'RoomFull' | 'Kicked';

/** One API for the host and a client, so the UI can be written once. Methods a role does not support are no-ops. */
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
  /**
   * How many players the room holds, for the refusal that says the room is
   * full.
   *
   * The host's number rather than a copy of the game's: `App` may not read
   * `GameConfig` for a client's own state, and a refusal quoting a different
   * limit from the room's would be a number nobody can argue with.
   */
  getRoomLimit(): number;
  /** Only the host calls this. Removes a player from the room. */
  kick(playerId: string): void;
  join(name: string, look: PlayerLook): void;
  setLook(look: PlayerLook): void;
  /**
   * The host setting the room's pace.
   *
   * Only the host calls this. A client pressing a pace button is looking at
   * what that pace would mean and does not ask for it, so there is no message
   * to send and this is a no-op on the client side — the host's answer arrives
   * in the public state instead.
   */
  setPace(pace: Pace): void;
  /**
   * Put an invented player in the room, for the host trying a room out alone.
   *
   * Only the host calls this, and only while the console is on. The bot joins
   * the roster like anyone else and nobody is told, because a client asking for
   * a player to appear is not a thing the room does.
   */
  addBot(): void;
  submitAnswer(text: string): void;
  rejectGroup(groupId: number): void;
  startGame(topic: string, durationMs: number): void;
  closePhase(durationMs: number): void;
  startNextRound(topic: string, durationMs: number): void;
  finish(): void;
  stop(): void;
}
