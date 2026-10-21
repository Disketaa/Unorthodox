import { HostState } from './GameState';
import {
  toPublicLobbyState,
  toPublicReviewingState,
  toPublicWritingState,
  toPublicChoosingState,
} from './PublicPhases';
import {
  toPublicFinalState,
  toPublicLeaderboardState,
  toPublicScoresState,
} from './PublicEndgame';
import { PlayerId, PlayerLook, ThemeId, ThemeMode, CustomTheme, assertNever } from '@/Core';
import type { RandomPick } from './GameState';
import type { Pace } from './GameConfig';

/** What a client is told about one player. */
export interface PublicPlayer {
  id: PlayerId;
  name: string;
  look: PlayerLook;
  /** Whether the host still has this player on the line. */
  isOnline: boolean;
}

/** What every phase tells a client about the room itself. The turn and the pace ride on all of
 * them rather than on one, because they outlive phases and the bar of players reads them in
 * every one. */
export interface PublicRoom {
  /** Whose turn it is, or null in a room nobody has played in yet. */
  turnPlayerId: PlayerId | null;
  /** The pace the host has set, which every phase is timed against. Sent to every client because
   * the settings card is drawn for clients too, and a card showing one pace while the room
   * plays another is worse than no card. */
  pace: Pace;
  /** The themes the host has left switched on, which every deal is drawn from. Sent for the
   * pace's reason and the same weight: a client that dealt its own bank out of the whole set
   * would put six different cards on six different screens in one room. */
  themes: ThemeId[];
  /** Which way the room is given its themes, sent beside the names because a client that guessed
   * it would deal a bank of six out of a pool the host never picked. */
  themeMode: ThemeMode;
  /** The custom themes this room knows, so every client can draw them in the bank. Sent as pairs
   * rather than a map, since this goes out as plain data. */
  customThemes: readonly CustomTheme[];
  /** How many rounds have been played in each theme, as pairs rather than a map, since this goes
   * out as plain data. On every phase because the bank is on screen through all of them. */
  spent: { theme: ThemeId; rounds: number }[];
  /** The seats the round's enchanted card reaches, drawn as a glint on the bar of players.
   * Optional, so a host that sends none reads as nobody reached. */
  affectedPlayerIds?: PlayerId[];
  /** The multiplier the round's card wears, which the answers it reaches are paid with.
   * Optional, and left out where the card carries none: a plain card multiplies nothing. */
  mult?: number;
  /** Whether the host is holding the room. On the wire rather than held per client, since a
   * player who is not held is one still playing against a timer nobody stopped. */
  /** What every seat stands at across the rounds so far, in every phase that has a room. Sent
   * separately from the per-round figures because those only exist where a round is being read
   * or counted, and a bar that could only read them showed every seat at nothing in between. */
  standings?: { id: PlayerId; score: number }[];
  paused: boolean;
  /** When the room was held, on the host's clock, or absent while it is running. On the wire
   * because a client that joined or refreshed mid-hold has to draw the clock as it stood when
   * the room stopped, rather than counting the hold away as if the phase had run through it. */
  pausedAt?: number;
  /** Which run of the phase the room is on, for a screen that rebuilds itself between two of
   * them. Not the phase's start: a held room's start moves on by however long it was held, so a
   * client keyed on it would rebuild on every let-go and replay the arrival. */
  reloadedAt?: number;
}

export type PublicLobbyState = PublicRoom & {
  phase: 'Lobby';
  players: PublicPlayer[];
};

export type PublicChoosingState = PublicRoom & {
  phase: 'Choosing';
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  /** The theme the room has settled on, once a card has been pressed. Absent while the bank is
   * still being offered. On the wire rather than decided per client, so every screen in the
   * room expands the same card at the same moment. */
  theme?: ThemeId;
  /** The room answering its own bank, once the clock ran out with nothing pressed. Sent with the
   * moment it started rather than only the answer, so every screen sweeps for the same length
   * and lands on the same card. */
  picking?: RandomPick;
  /** When the room answered its bank, or absent while it is still open. On the wire because the
   * countdown has to stop on every screen at the moment it stopped on the host's. */
  answeredAt?: number;
  /** How much of this clock runs before the room can see the phase. Absent rather than zero
   * where there is none, since an earlier build did not send it and a zero is a real length. */
  leadInMs?: number;
  /** The round's question, once the theme has been answered. Absent before that. On the wire
   * because the room has to be shown the same words arriving at the same moment, and a client
   * that picked its own question would be answering a question nobody else can see. */
  question?: string;
  /** When the question began arriving, on the host's clock, for the same reason. */
  questionAt?: number;
};

export type PublicWritingState = PublicRoom & {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  startedAt: number;
  submittedCount: number;
  /** Who has sent an answer. The count cannot say whose, and the bar marks every seat still at
   * work. Only who, never what. Optional: an older host sends none, and is then read as all. */
  submittedIds?: PlayerId[];
  /** Who among those has started writing over the answer they sent, so their seat goes back to
   * work for the whole room rather than only for themselves. Optional like the list above: an
   * older host sends neither, and a room that cannot say is read as nobody editing. */
  editingIds?: PlayerId[];
  players: PublicPlayer[];
  theme?: ThemeId;
};

export type PublicReviewingState = PublicRoom & {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  /** One answer group as the room is shown it. `isEmpty` marks the card of a player who wrote
   * nothing, so the room sees who sat the round out rather than seeing somebody missing. */
  groups: PublicScoreGroup[];
  /** The groups the host has muted, which the whole room is shown. A card one player can see
   * struck out and another cannot is a card the room cannot talk about. Optional, so a host
   * that sends none reads as nothing muted rather than as every card muted. */
  mutedGroupIds?: number[];
  /** How many players liked each answer, and nothing else. A card that said who liked it would
   * be saying who read it, on a board played by people who cannot see who wrote what. Optional
   * like the list above, so a round nobody liked anything in carries no field. */
  likeCounts?: { groupId: number; count: number }[];
  /** Every player's running total, from the board as it stands, sent while the round is still
   * open so the bar shows who is ahead before the round is scored. The host's figure, since a
   * client scoring the round itself would show a different number from every other screen. */
  cumulative?: { id: PlayerId; score: number }[];
  theme?: ThemeId;
};

export type PublicScoresState = PublicRoom & {
  phase: 'Scores';
  topic: string;
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  scores: { id: PlayerId; score: number }[];
  /** The round total per player, which is what the bar of players shows. */
  cumulative: { id: PlayerId; score: number }[];
  /** The board as it was when the room finished reading it, sent again because this phase draws
   * the same screen the room is already looking at. A room shown a bare stage while it is told
   * what it won has had its board taken away at the moment it wanted to look up what it won. */
  groups: PublicScoreGroup[];
  likeCounts?: PublicReviewingState['likeCounts'];
  mutedGroupIds?: PublicReviewingState['mutedGroupIds'];
  /** Whether this phase is the round counted rather than the round still being read. The room
   * draws the board at rest: nothing is turned over again, and no answer is written out twice. */
  settled: true;
  theme?: ThemeId;
};

/** One answer card as the room is shown it. One shape for both halves of a round rather than one
 * each, so the screen that draws the board draws the same card whichever half it is on: two
 * shapes differing by an optional field is a card whose score goes missing in one of them. */
export interface PublicScoreGroup {
  groupId: number;
  text: string;
  playerCount: number;
  playerIds: PlayerId[];
  isEmpty: boolean;
  /** How the card's total is built: what the answer was worth on its own, what the round's card
   * made of it, what the room thought of it, and the total the count-up stops at. Left out
   * while the round is still being read, and on a card that paid nothing. */
  score?: {
    base: number;
    mult: number;
    likes: number;
    total: number;
  };
}

export type PublicLeaderboardState = PublicRoom & {
  phase: 'Leaderboard';
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  /** Where every player stands over the rounds so far, which is what this phase draws. */
  scores: { id: PlayerId; score: number }[];
  /** What the round just paid each player, which stands beside the standing: the room is told
   * the round's figure and the total in one line. */
  round: { id: PlayerId; score: number }[];
  theme?: ThemeId;
};

export type PublicFinalState = PublicRoom & {
  phase: 'Final';
  durationMs: number;
  players: PublicPlayer[];
  scores: { id: PlayerId; score: number }[];
  theme?: ThemeId;
};

export type PublicState =
  | PublicLobbyState
  | PublicChoosingState
  | PublicWritingState
  | PublicReviewingState
  | PublicScoresState
  | PublicLeaderboardState
  | PublicFinalState;

export function toPublicState(hostState: HostState): PublicState {
  switch (hostState.phase) {
    case 'Lobby':
      return toPublicLobbyState(hostState);
    case 'Choosing':
      return toPublicChoosingState(hostState);
    case 'Writing':
      return toPublicWritingState(hostState);
    case 'Reviewing':
      return toPublicReviewingState(hostState);
    case 'Scores':
      return toPublicScoresState(hostState);
    case 'Leaderboard':
      return toPublicLeaderboardState(hostState);
    case 'Final':
      return toPublicFinalState(hostState);
    default:
      // The exhaustive switch ensures we never reach here.
      return assertNever(hostState);
  }
}
