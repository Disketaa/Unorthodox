import { PublicState } from '@/Game';

export type SessionRole = 'Host' | 'Player';

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
  join(name: string): void;
  submitAnswer(text: string): void;
  rejectGroup(groupId: number): void;
  startGame(topic: string, durationMs: number): void;
  closePhase(durationMs: number): void;
  startNextRound(topic: string, durationMs: number): void;
  finish(): void;
  stop(): void;
}
