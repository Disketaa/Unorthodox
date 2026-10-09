import { PlayerLook, ThemeId } from '@/Core';
import { PublicState, Pace } from '@/Game';
import type { ConnectionHint } from '@/Network';

export type SessionRole = 'Host' | 'Player';

/** Why this player is not in the room, if they are not. */
export type BlockedReason = 'NameTaken' | 'AlreadyStarted' | 'RoomFull' | 'Kicked';

/** What this device can say about a wait going on too long, worked out in the Network layer and
 * re-exported rather than re-declared, so the two cannot drift into disagreeing. */
export type { ConnectionHint } from '@/Network';

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
  /** What this device can say about a wait that is going on too long, or undefined while it is
   * still within the ordinary time a room takes to answer. */
  getConnectionHint(): ConnectionHint | undefined;
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
  /** Start the game - transitions from Lobby to Choosing. */
  startGame(): void;
  /** The topic comes from whoever picked the theme, not from the session: the session does not
   * know what a theme asks about. */
  startWriting(topic: string): void;
  /** The round's question, drawn by whoever holds the content, shown to the whole room word by
   * word before the round starts. The session does not choose it either: what a theme asks
   * about is not the game's business. */
  revealQuestion(question: string): void;
  /** Answer the theme bank on this player's behalf. Refused by the host from anybody but the
   * player whose turn it is. */
  chooseTheme(theme: ThemeId): void;
  /** Only the host calls this: the bank closed with nothing pressed, so the room answers it. */
  startRandomPick(): void;
  /** Only the host calls this: the sweep is over and the room's roll commits. */
  resolveRandomPick(): void;
  /** Only the host calls this: hold the room still, or let it run again. Every clock in the room
   * stops and starts on this, not just the one on screen. */
  setPaused(paused: boolean): void;
  /** Advance out of the Writing phase once everyone has answered, or out of the Reviewing phase
   * (once reviewing time is up, going to Scores). */
  endReviewing(durationMs: number): void;
  /** Advance from Scores or Reviewing to the next round's Choosing phase. */
  nextRound(): void;
  /** Advance to the next phase according to the phase flow table. The topic only matters to the
   * phases that show one, so a jump out of a phase that has none passes an empty string. */
  nextPhase(topic: string): void;
  finish(): void;
  stop(): void;
}
