import { PlayerId, PlayerLook, ThemeId } from '@/Core';
import { Pace } from './GameConfig';

/** What the room remembers about one player: who they are, how they look, and whether they are
 * still on the line. Presence is the host's to record, because only the host sees every peer
 * connect and drop. */
export interface Player {
  name: string;
  look: PlayerLook;
  isOnline: boolean;
}

/** What every phase carries, whatever the room is doing. The roster, the totals and the pace
 * outlive the phase, and have to: a player who refreshes mid-round is let back in because their
 * seat is still here, and the standings are the totals of every round. */
export interface RoomMembers {
  players: Map<PlayerId, Player>;
  cumulativeScores: Map<PlayerId, number>;
  /** Whose turn it is, in roster order, or null in a room nobody has played in yet. Carried by
   * every phase rather than by one, since a turn is the room's and not the round's. */
  turnPlayerId: PlayerId | null;
  /** The pace the host has set, which every phase is timed against. In the state rather than the
   * UI, so a client is told the answer rather than guessing it from its own click. The lobby
   * buttons are drawn for clients too, to show what a pace would mean. */
  pace: Pace;
  /** How many rounds have been played in each theme. Per theme rather than one running total,
   * since the bank is the same six themes every round and each of them drains at its own rate. */
  themeRounds: Map<ThemeId, number>;
}

export type LobbyState = RoomMembers & {
  phase: 'Lobby';
};

export type ChoosingState = RoomMembers & {
  phase: 'Choosing';
  durationMs: number;
  startedAt: number;
  /** The theme the room settled on. The room's answer rather than one player's, so a press is
   * seen by everybody rather than by its author. Undefined while the bank is still open. */
  theme: ThemeId | undefined;
  /** A room that answered its own bank, and where that answer came from. The theme is held here
   * rather than in `theme` until the sweep has run, since the bank is still open on screen
   * while it plays and a card that expanded under the sweep would hide it. */
  picking: RandomPick | undefined;
  /** When the room answered its own bank, and from then on the clock is over: the answer is up
   * on screen and the room is looking at it, so a countdown still running would be counting
   * down something nobody can change any more. */
  answeredAt: number | undefined;
  /** How much of this phase's clock runs before the room can see it: the count-in, played over
   * the lobby this phase started from. A bar drawn against the whole of it would sit short of
   * full the moment the bank appears, so the lead-in is not part of the bar. */
  leadInMs: number;
};

/** The room's roll, landing on a theme. Carries when it started so every screen in the room runs
 * its sweep from the same moment rather than from whenever the message reached it. */
export interface RandomPick {
  theme: ThemeId;
  startedAt: number;
}

export type WritingState = RoomMembers & {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  startedAt: number;
  answers: Map<PlayerId, string>;
  /** The theme this round is being played in, carried on from the choice rather than chosen
   * again: the bank stays on screen through the round, and it can only show one of its cards as
   * the chosen one. */
  theme: ThemeId | undefined;
};

export type ReviewingState = RoomMembers & {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  answers: Map<PlayerId, string>;
  /** groupId -> the playerIds who voted that group not suitable */
  groupRejections: Map<number, Set<PlayerId>>;
  /** As in Writing: the round's theme, so the bank on screen still shows what is being played. */
  theme: ThemeId | undefined;
};

export type ScoresState = RoomMembers & {
  phase: 'Scores';
  durationMs: number;
  startedAt: number;
  scores: Map<PlayerId, number>;
  /** As in Writing: the round's theme, which the bank on screen is still showing off. */
  theme: ThemeId | undefined;
};

export type FinalState = RoomMembers & {
  phase: 'Final';
  /** The theme the game was finally played in. The bank is on the last screen too, and a bank
   * with nothing chosen on it reads as a game that was never about anything. */
  theme: ThemeId | undefined;
};

export type HostState =
  LobbyState | ChoosingState | WritingState | ReviewingState | ScoresState | FinalState;

/** A room with nobody in it and nobody holding the turn. One function rather than three
 * literals, so a new room cannot be shaped differently from a resumed one. */
export function freshLobbyState(): LobbyState {
  return {
    phase: 'Lobby',
    players: new Map(),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themeRounds: new Map<ThemeId, number>(),
  };
}
