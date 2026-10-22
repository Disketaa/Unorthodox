/** The host's own moves between phases, kept out of the session so the file that owns the roster
 * owns none of the round flow. Every duration is read from the phase table here rather than
 * passed in, so a phase cannot be entered at a length the table does not give it. */
import * as Game from '@/Game';
import type { HostState } from '@/Game';
import type { PlayerId, ThemeId } from '@/Core';
import { playableTheme } from './HostThemePool';
import {
  countInMs,
  reviewingMs,
  scoresMs,
  openingMs,
  bankSize,
  roomThemes,
} from './HostDurations';
import {
  startGame,
  startWriting,
  revealQuestion,
  startRandomPick,
  resolveRandomPick,
  chooseTheme,
  setPaused,
  closeWriting,
  closeReviewing,
  nextRound,
  nextPhase,
} from './HostPhases';

/** What the flow needs from the session that owns it: the room's state, its pace, how many
 * answers the roster is waiting for, and the one way to write a new state. */
export interface FlowHost {
  getState(): HostState | undefined;
  /** How many players have to answer before Writing is allowed to close. */
  expectedAnswers(): number;
  commit(state: HostState): void;
}

/** Start the game: out of the lobby and into the theme choice. */
export function startGameFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  const leadInMs = countInMs();
  const choosingMs = Game.phaseDurationMs('Choosing', state.pace) + leadInMs;
  host.commit(startGame(state, choosingMs, leadInMs));
}

/** Holding the room, or letting it run again. */
export function setPausedFrom(host: FlowHost, paused: boolean): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(setPaused(state, paused));
}

/** The theme answered, so the round's question starts arriving on screen. */
export function revealQuestionFrom(host: FlowHost, question: string): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(revealQuestion(state, question));
}

/** Start a round: out of the theme choice and into answering it. The room's code rides along
 * because the card the room has just chosen carries the round's multiplier, and that is rolled
 * from the code rather than kept anywhere. */
export function startWritingFrom(host: FlowHost, roomCode: string, topic: string): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(
    startWriting(state, roomCode, topic, Game.phaseDurationMs('Writing', state.pace))
  );
}

/** The bank closed with nothing pressed on it, so the room is answering its own. */
export function startRandomPickFrom(host: FlowHost, roomCode: string): void {
  const state = host.getState();
  if (state === undefined) return;
  // Nothing left to answer: the sweep would land on a spent card, so the show that names the
  // winner ends the game instead.
  if (playableTheme(state, roomCode, Math.random) === undefined) {
    const showMs = Game.winningDurationMs(bankSize(state));
    host.commit(nextPhase(state, 'Winning', '', showMs));
    return;
  }
  host.commit(startRandomPick(state, roomCode));
}

/** The sweep is over and the roll commits. */
export function resolveRandomPickFrom(host: FlowHost, roomCode: string): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(resolveRandomPick(state, roomCode));
}

/** A seat answering the bank from the host's own screen. */
export function chooseThemeFrom(
  host: FlowHost,
  roomCode: string,
  theme: ThemeId,
  playerId: PlayerId
): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(chooseTheme(state, roomCode, theme, playerId));
}

/** Advance out of Writing once everyone has answered, or out of Reviewing once its clock is up.
 * The opened phase's length is worked out from the room rather than taken in: both are facts
 * about the round, and a figure passed in would stop being true the moment the room changed. */
export function endReviewingFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  const next =
    state.phase === 'Writing'
      ? closeWriting(state, reviewingMs(state), host.expectedAnswers())
      : closeReviewing(state, scoresMs(state));
  host.commit(next);
}

/** The next round's theme choice, from the round that just scored. The last round of a game gets
 * the show that names the winner instead: the room is not dealt a theme that is not there. */
export function nextRoundFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  const over = Game.roomIsOver(state.themeRounds, roomThemes(state));
  // The show that names the winner is the last thing the room sees of the game: a room already on
  // those standings has seen it, and a room with nothing left to play goes straight to the show.
  if (over) {
    const next =
      state.phase === 'Leaderboard'
        ? 'Lobby'
        : state.phase === 'Winning'
          ? 'Leaderboard'
          : 'Winning';
    host.commit(nextPhase(state, next, '', openingMs(state, next)));
    return;
  }
  host.commit(nextRound(state, Game.phaseDurationMs('Choosing', state.pace)));
}

/** The same phase begun again, from the dock: the room watches the reveal again with nothing
 * rewritten and no vote retaken. */
export function reloadPhaseFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(Game.reducer(state, { type: 'RELOAD_PHASE', startedAt: Date.now() }));
}

/** The phases where the room is in the middle of a round. The game is not over while one of them
 * is on: the last round is still being played. */
const InPlay: readonly Game.PhaseName[] = ['Choosing', 'Writing', 'Reviewing'];

/** Where the room goes when a phase ends on its own: the table's own order, except where the
 * game is over — the last count ends in the show that names the winner, the standings after it
 * are the game's, and a bank with nothing playable left cannot start another round at all. */
function nextAfter(state: HostState): Game.PhaseName {
  const over = Game.roomIsOver(state.themeRounds, roomThemes(state));
  if (state.phase === 'Lobby') return Game.phaseAfterCycling(state.phase);
  if (over) {
    if (state.phase === 'Scores') return 'Winning';
    if (state.phase === 'Winning') return 'Leaderboard';
    if (state.phase === 'Choosing') return 'Winning';
    return 'Lobby';
  }
  if (InPlay.includes(state.phase)) return Game.phaseAfterCycling(state.phase);
  return Game.phaseAfterCycling(state.phase);
}

/** Wherever the phase table says goes next, which is how the host's clock ends a phase without
 * this file having to know any phase by name. */
export function nextPhaseFrom(host: FlowHost, topic: string): void {
  const state = host.getState();
  if (state === undefined) return;
  const next = nextAfter(state);
  host.commit(nextPhase(state, next, topic, openingMs(state, next)));
}
