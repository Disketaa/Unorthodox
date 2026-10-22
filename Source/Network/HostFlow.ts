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
export function nextRoundFrom(host: FlowHost, roomCode: string): void {
  const state = host.getState();
  if (state === undefined) return;
  const over = Game.roomIsOver(state.themeRounds, roomThemes(state, roomCode));
  // The show that names the winner is the last thing the room sees of the game: a room already on
  // those standings has seen it, and a room with nothing left to play goes straight to the show.
  if (over) {
    // The leaderboard after the winning show is the last phase the room sees: it does not go
    // back to the lobby, and the room is not dealt another theme that is not there.
    if (state.phase === 'Leaderboard') return;
    const next = state.phase === 'Winning' ? 'Leaderboard' : 'Winning';
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

/** Where the room goes when a phase ends on its own: the table's own order, except where the
 * game is over — the last count ends in the show that names the winner, the standings after it
 * are the game's, and a bank with nothing playable left cannot start another round at all. */
function nextAfter(state: HostState, roomCode: string): Game.PhaseName {
  if (state.phase === 'Lobby') return Game.phaseAfterCycling(state.phase);
  // Writing and Reviewing always finish the round, even when the game is over: the last round
  // still reaches its count and its places before the show.
  if (state.phase === 'Writing') return 'Reviewing';
  if (state.phase === 'Reviewing') return 'Scores';
  // A Choosing the room has already answered is a round under way: the theme is picked and the
  // question is being read, so even the game's last round is still written, reviewed and counted
  // before its winner is named. Choosing with no theme picked has no round to play.
  if (state.phase === 'Choosing' && state.theme !== undefined) return 'Writing';
  const over = Game.roomIsOver(state.themeRounds, roomThemes(state, roomCode));
  if (!over) return Game.phaseAfterCycling(state.phase);
  // The count of the last round ends in the show, then the game's standings. The standings are
  // the last phase the room sees: they do not lead back to the lobby.
  if (state.phase === 'Scores') return 'Winning';
  if (state.phase === 'Winning') return 'Leaderboard';
  if (state.phase === 'Choosing') return 'Winning';
  return state.phase;
}

/** Wherever the phase table says goes next, which is how the host's clock ends a phase without
 * this file having to know any phase by name. */
export function nextPhaseFrom(host: FlowHost, roomCode: string, topic: string): void {
  const state = host.getState();
  if (state === undefined) return;
  const next = nextAfter(state, roomCode);
  host.commit(nextPhase(state, next, topic, openingMs(state, next)));
}
