/** The phases a game is made of, as one table. Everything else asks about a phase through here
 * rather than naming one: the host's clock, the sentence at the top of a screen, the row the
 * screens are picked from. A new game is a new row rather than a new switch in three files. */
import { GameConfig, type Pace, type PaceTimings } from './GameConfig';
import type { HostState } from './GameState';
import { standingsDurationMs } from './Leaderboard';
import { reviewingDurationMs } from './Reveal';
import { scoresDurationMs } from './ScoreCount';
import { winningDurationMs } from './Winning';

/** Every phase name, in the order the game runs them. A tuple rather than a literal union so a
 * caller can ask for the first phase: the host's clock has to land somewhere even at the end. */
const PhaseNames = [
  'Lobby',
  'Choosing',
  'Writing',
  'Reviewing',
  'Scores',
  'Leaderboard',
  'Winning',
] as const;

/** The names a phase goes by, taken off the table rather than written out again. */
export type PhaseName = (typeof PhaseNames)[number];

/** What one phase is: whether a clock ends it, how long it runs, and what follows it. */
export interface PhaseSpec {
  /** Whether the host's own clock ends this phase. A phase nobody waits out is ended by a player
   * instead, and asking for a countdown on one would show a bar that never moves. */
  timed: boolean;
  /** How long the phase runs at the room's pace, or null for a phase nobody waits out. */
  waitMs: (pace: PaceTimings) => number | null;
  /** Extra time the host waits past the clock before closing, so a late answer still counts. */
  graceMs: number;
  /** The phase that follows, or null where the room stops here. `Choosing` is the exception
   * worth naming: it reaches `Writing` only if a theme was picked, so that move is the
   * player's. */
  next: PhaseName | null;
  /** Whether arriving at this phase plays the splash. A row here rather than a list in the
   * overlay, so a hand-off is added by naming a phase and the movement stays the same
   * everywhere it is used. */
  splash: boolean;
}

/** The flow of a game, in order. The `next` field repeats the order because a caller in the
 * middle of a round cannot know where it is. */
export const PhaseFlow: Record<PhaseName, PhaseSpec> = {
  Lobby: { timed: false, waitMs: () => null, graceMs: 0, next: 'Choosing', splash: false },
  Choosing: {
    timed: true,
    waitMs: (pace) => pace.categoryMs,
    graceMs: 0,
    next: 'Writing',
    splash: true,
  },
  Writing: {
    timed: true,
    waitMs: (pace) => pace.writingMs,
    graceMs: GameConfig.timing.graceMs,
    next: 'Reviewing',
    splash: false,
  },
  Reviewing: {
    timed: true,
    /** The floor of the review, for a board of no cards: the lead-in and the room's beat of
     * voting. The real length is a fact about the board rather than the pace, so the host works
     * it out from the cards. */
    waitMs: (pace) => reviewingDurationMs([], pace),
    graceMs: 0,
    next: 'Scores',
    splash: true,
  },
  Scores: {
    timed: true,
    /** The floor of the count, for a board of no cards: how long the room is given to look at
     * what it has just been shown. The real length is a fact about the board rather than the
     * pace, so the host works it out from the cards; quoted here so the table still answers. */
    waitMs: () => scoresDurationMs(0),
    graceMs: 0,
    next: 'Leaderboard',
    splash: false,
  },
  Leaderboard: {
    timed: true,
    /** The floor of the show, for a room of nobody: how long the room is given to look at the
     * places it has just been shown. The real length is a fact about the room, so the host
     * works it out from the standings; quoted here so the table still answers. */
    waitMs: () => standingsDurationMs(0),
    graceMs: 0,
    next: 'Choosing',
    splash: false,
  },
  Winning: {
    timed: true,
    /** The floor of the show, for a bank of no cards: the room's beat of looking at the winner.
     * The real length is a fact about the bank rather than the pace, so the host works it out
     * from the cards; quoted here so the table still answers. */
    waitMs: () => winningDurationMs(0),
    graceMs: 0,
    next: 'Leaderboard',
    splash: false,
  },
};

/** Whether a name is a phase the game runs, as opposed to `Connecting`, which is this browser's
 * own moment before the host has said anything and so is not a row in the table. */
export function isPhaseName(value: string): value is PhaseName {
  return Object.prototype.hasOwnProperty.call(PhaseFlow, value);
}

/** How long a phase runs at the room's pace, or 0 for a phase nobody waits out: a caller here is
 * about to measure a wait, and a measure with nothing in it is zero rather than an error. */
export function phaseDurationMs(phase: PhaseName, pace: Pace): number {
  return PhaseFlow[phase].waitMs(GameConfig.paces[pace]) ?? 0;
}

/** The extra time the host waits past the clock before closing, so a late answer still counts. */
export function phaseGraceMs(phase: PhaseName): number {
  return PhaseFlow[phase].graceMs;
}

/** The phase a phase is followed by, or null where the room stops there. */
export function phaseAfter(phase: PhaseName): PhaseName | null {
  return PhaseFlow[phase].next;
}

/** The phase a timed phase is followed by, wrapping to the first phase instead of stopping. Only
 * asked of timed phases, which is why Final being terminal is not a contradiction here. */
export function phaseAfterCycling(phase: PhaseName): PhaseName {
  return PhaseFlow[phase].next ?? PhaseNames[0];
}

/** Whether a round can end from here: the count, a review the room abandoned, and the standings
 * a played round ends on. Named here so the round-ending moves cannot list the phases
 * differently, and narrowing as it goes so the moves keep the phase's own shape. */
export function endsRound(
  state: HostState
): state is Extract<HostState, { phase: 'Reviewing' | 'Scores' | 'Leaderboard' }> {
  return (
    state.phase === 'Reviewing' || state.phase === 'Scores' || state.phase === 'Leaderboard'
  );
}

/** Whether the host's clock ends this phase, which is what decides whether a countdown is drawn
 * over it at all. */
export function isTimedPhase(phase: PhaseName): boolean {
  return PhaseFlow[phase].timed;
}

/** Whether arriving at this phase plays the splash. Asked of a name rather than of a row, since
 * `Connecting` is this browser's own moment before the host has said anything and so is not a
 * row in the table: it never splashes. */
export function splashesOnArrival(phase: string): boolean {
  return isPhaseName(phase) && PhaseFlow[phase].splash;
}
