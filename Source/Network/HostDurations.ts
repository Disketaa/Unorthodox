/** Durations and bank sizes the host works out before opening a phase. Kept out of `HostFlow` so
 * that file stays about where the room goes next rather than how long each stop takes. */
import * as Game from '@/Game';
import type { HostState } from '@/Game';

/** How long the count-in runs, shade and numbers together. It plays out over the lobby the room
 * just left, and the theme clock starts the instant Start is pressed, so the first Choosing is
 * given this much extra. Later rounds have no count-in to pay for. */
export function countInMs(): number {
  const { startVeilMs, startCountdownMs } = Game.GameConfig.timing;
  return startVeilMs + startCountdownMs;
}

/** How long the reviewing round runs for the room: a floor for being in it at all — five seconds
 * briskly, ten slowly — and five more for every player after the first. Read here rather than
 * off the phase table, which has one figure per pace where the room needs one per room size. */
export function reviewingMs(state: HostState): number {
  if (state.phase !== 'Writing') return Game.phaseDurationMs('Reviewing', state.pace);
  const board = Game.boardWriterCounts(state);
  return Game.reviewingDurationMs(board, Game.GameConfig.paces[state.pace]);
}

/** How long the count runs for the board the room is about to be shown: one turn per card it
 * actually has. Read here rather than off the phase table for the same reason `reviewingMs` is:
 * the length is a fact about this round, and the table has one figure per pace. */
export function scoresMs(state: HostState): number {
  if (state.phase !== 'Reviewing' && state.phase !== 'Scores') {
    return Game.phaseDurationMs('Scores', state.pace);
  }
  return Game.scoresDurationMs(Game.boardCardCount(state));
}

/** How long the standing list runs for the room about to be shown it: the wave the places arrive
 * in, and then the show itself. Read here rather than off the phase table for the same reason
 * `scoresMs` is: the length is a fact about this room. */
export function standingsMs(state: HostState): number {
  if (state.phase !== 'Scores' && state.phase !== 'Leaderboard') {
    return Game.phaseDurationMs('Leaderboard', state.pace);
  }
  return Game.standingsDurationMs(state.cumulativeScores.size);
}

/** How many cards the room's bank holds, which is how long the show that takes it away runs for.
 * The host's own themes rather than the ones it was sent, since the host is where the bank is
 * rolled from. */
export function bankSize(state: HostState): number {
  return Game.bankSize({
    themeMode: state.themeMode,
    themes: state.themes,
    customThemes: [...(state.customThemes?.values() ?? [])],
  });
}

/** How long the phase about to be opened runs for this room. Four of them are a fact about the
 * round rather than the pace — the review follows the room, the count the board, the standings
 * what the round paid, and the show what the bank holds. */
export function openingMs(state: HostState, next: Game.PhaseName): number {
  if (next === 'Reviewing') return reviewingMs(state);
  if (next === 'Scores') return scoresMs(state);
  if (next === 'Leaderboard') return standingsMs(state);
  if (next === 'Winning') return Game.winningDurationMs(bankSize(state));
  return Game.phaseDurationMs(next, state.pace);
}

/** The themes the room's bank actually holds, and how many rounds each of them can be played
 * for. The dealt bank rather than the pool: a theme nobody was dealt cannot keep the room open.
 * The deal is rolled from the code, so the host and every client reach the same bank. */
export function roomThemes(state: HostState, roomCode: string): Game.RoomTheme[] {
  return Game.roomThemes({
    roomCode,
    pace: state.pace,
    themeMode: state.themeMode,
    themes: state.themes,
    customThemes: [...(state.customThemes?.values() ?? [])],
  });
}
