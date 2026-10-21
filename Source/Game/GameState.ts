import { PlayerId, PlayerLook, ThemeId, ThemeMode, CustomTheme } from '@/Core';
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
  /** The themes the host has named, and which way the room is given them: the pool every deal is
   * drawn from. In the state for the pace's reason, since a client that dealt its own bank
   * would put different cards on every screen in one room. A room starts on the random bank. */
  themes: readonly ThemeId[];
  /** Which of the two ways the room is given its themes. Held beside the names rather than as
   * one of them, since a host who has looked at the random bank and come back has not forgotten
   * what they chose. */
  themeMode: ThemeMode;
  /** The custom themes this room knows: their names, tints and questions. Sent to every client
   * so every screen can draw the same bank, and saved to each browser's cache so they survive a
   * refresh. */
  customThemes?: Map<string, CustomTheme>;
  /** How many rounds have been played in each theme. Per theme rather than one running total,
   * since the bank is the same six themes every round and each drains at its own rate. */
  themeRounds: Map<ThemeId, number>;
  /** The seats the round's enchanted card reaches. Empty where the card carried no effect, and
   * empty again the moment a new bank is offered. Optional, so an older save reads as nobody. */
  affectedPlayers?: Set<PlayerId>;
  /** Whether the host has held the room, which stops every clock and every answer at once. The
   * room's rather than the host screen's: a player watching a timer run on has to be stopped by
   * the same hand that started it. */
  paused: boolean;
  /** When the room was held, on the host's clock, or undefined while it is running. Kept so
   * letting go can move the phase's clock on by exactly the time it was held, rather than by
   * however long the host took to notice. */
  pausedAt: number | undefined;
  /** Which run of the phase the room is on, for a screen that has to tell two apart. The phase's
   * start is not that number: a held room's start is moved on by however long it was held, so
   * anything keyed on it takes the host's pause for a restart. */
  reloadedAt?: number;
}

export type LobbyState = RoomMembers & {
  phase: 'Lobby';
};

/** The room-level members a phase starts from, always a running room: a pause belongs to the
 * phase that was held, and the next phase is a fresh start. Every phase is built from this, so
 * a hold cannot leak into a round nobody paused. */
export function membersOf(state: HostState): RoomMembers {
  return {
    players: state.players,
    cumulativeScores: state.cumulativeScores,
    turnPlayerId: state.turnPlayerId,
    pace: state.pace,
    themes: state.themes,
    themeMode: state.themeMode,
    customThemes: state.customThemes,
    themeRounds: state.themeRounds,
    affectedPlayers: state.affectedPlayers,
    paused: false,
    pausedAt: undefined,
  };
}

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
  /** The question this round will ask, drawn from the theme's bank once the theme is answered.
   * Held here rather than passed at Writing so the whole room can be shown the same question
   * arriving word by word before anybody can type at it. Undefined while the bank is open. */
  question: string | undefined;
  /** When the question began arriving, on the host's clock, so every screen in the room writes
   * it out from the same moment rather than from whenever the message reached it. */
  questionAt: number | undefined;
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
  /** How far into the writing clock each answer reached the host, as a share from zero to one,
   * and that share is the whole of the speed bonus. The share and not the moment, because a
   * moment only means anything beside the clock of the round that took it. */
  answerShares?: Map<PlayerId, number>;
  /** The multiplier the round's card wears, or absent where it carried none. */
  mult?: number;
  /** Who among those who have answered is writing over the one they sent. Beside the answers
   * rather than by dropping them from it, so a player who changes their mind and runs out of
   * time still counts as having answered. Optional: a room saved before this reads as nobody. */
  editing?: Set<PlayerId>;
  /** The theme this round is being played in, carried on from the choice rather than chosen
   * again: the bank stays on screen through the round, and it can only show one of its cards as
   * the chosen one. */
  theme: ThemeId | undefined;
};

/** A round's board: the answers as written, how quickly each reached the room, and the room's
 * marks on them. Carried by both halves of a round rather than written out twice, since
 * counting a round is the same board looked at once more. */
export type BoardState = RoomMembers & {
  topic: string;
  durationMs: number;
  startedAt: number;
  answers: Map<PlayerId, string>;
  /** As in Writing: how far into the writing clock each answer reached the host. The round is
   * scored from here, and the bar shows the running total while the round is still open. */
  answerShares?: Map<PlayerId, number>;
  /** As in Writing: the multiplier the round's card wears. */
  mult?: number;
  /** groupId -> the playerIds who voted that group not suitable */
  groupRejections: Map<number, Set<PlayerId>>;
  /** groupId -> the playerIds who liked that group's answer, held per round like the rejections
   * beside it. The playerIds rather than a count, so a like can be taken back and the host can
   * tell a like on somebody's own answer from one on anybody else's. */
  groupLikes: Map<number, Set<PlayerId>>;
  /** As in Writing: the round's theme, so the bank on screen still shows what is being played. */
  theme: ThemeId | undefined;
};

/** The round while the room is still reading it: the board is being turned over, the answers are
 * being liked and turned down, and the score is moving under all of it. */
export type ReviewingState = BoardState & {
  phase: 'Reviewing';
};

/** The round counted, with the board still up. A subphase of reviewing rather than a screen of
 * its own: what the room is looking at has not changed, only what the room now knows about it. */
export type ScoresState = BoardState & {
  phase: 'Scores';
  /** What the round paid each player, settled once at the change. */
  scores: Map<PlayerId, number>;
};

/** Where the room stands after a round, and for as long as the room looks at it. A phase of its
 * own rather than a stretch of the count: the board is counted card by card and the places are
 * shown once, at the end, and the room is given a beat of its own to read them in. */
export type LeaderboardState = RoomMembers & {
  phase: 'Leaderboard';
  durationMs: number;
  startedAt: number;
  /** What the round just paid each player, which the places show beside what they have
   * altogether: the room is told the round's figure and the standing in one line. */
  scores: Map<PlayerId, number>;
  /** The theme the round just played, which the bank is still showing behind the places. */
  theme: ThemeId | undefined;
};

export type FinalState = RoomMembers & {
  phase: 'Final';
  /** The theme the game was finally played in. The bank is on the last screen too, and a bank
   * with nothing chosen on it reads as a game that was never about anything. */
  theme: ThemeId | undefined;
};

export type HostState =
  | LobbyState
  | ChoosingState
  | WritingState
  | ReviewingState
  | ScoresState
  | LeaderboardState
  | FinalState;

/** A room with nobody in it and nobody holding the turn. One function rather than three
 * literals, so a new room cannot be shaped differently from a resumed one. */
export function freshLobbyState(): LobbyState {
  return {
    phase: 'Lobby',
    players: new Map(),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    customThemes: new Map<string, CustomTheme>(),
    themeRounds: new Map<ThemeId, number>(),
    paused: false,
    pausedAt: undefined,
  };
}
