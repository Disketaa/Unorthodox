import { PlayerLook } from '@/Core';
import { PublicState } from '@/Game';

export type SessionRole = 'Host' | 'Player';

/** Why this player is not in the room, if they are not. */
export type BlockedReason = 'NameTaken' | 'Kicked';

/**
 * One API for the host and a client, so the UI can be written once. Methods a
 * role does not support are no-ops.
 */
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
  /** Only the host calls this. Removes a player from the room. */
  kick(playerId: string): void;
  join(name: string, look: PlayerLook): void;
  setLook(look: PlayerLook): void;
  submitAnswer(text: string): void;
  rejectGroup(groupId: number): void;
  startGame(topic: string, durationMs: number): void;
  closePhase(durationMs: number): void;
  startNextRound(topic: string, durationMs: number): void;
  finish(): void;
  stop(): void;
}
