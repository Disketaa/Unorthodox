/** The host's own moves between phases, kept out of the session so the file that owns the roster
 * owns none of the round flow. Every duration is read from the phase table here rather than
 * passed in, so a phase cannot be entered at a length the table does not give it. */
import * as Game from '@/Game';
import type { HostState } from '@/Game';
import type { PlayerId, ThemeId } from '@/Core';
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

/** How long the count-in runs, shade and numbers together. It plays out over the lobby the room
 * just left, and the theme clock starts the instant Start is pressed, so the first Choosing is
 * given this much extra. Later rounds have no count-in to pay for. */
function countInMs(): number {
  const { startVeilMs, startCountdownMs } = Game.GameConfig.timing;
  return startVeilMs + startCountdownMs;
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

/** How long the reviewing round runs for the room: a floor for being in it at all — five seconds
 * briskly, ten slowly — and five more for every player after the first. Read here rather than
 * off the phase table, which has one figure per pace where the room needs one per room size. */
function reviewingMs(state: HostState): number {
  if (state.phase !== 'Writing') return Game.phaseDurationMs('Reviewing', state.pace);
  return Game.reviewingDurationMs(state.players.size, state.pace);
}

/** How long the count runs for the board the room is about to be shown: one turn per card it
 * actually has. Read here rather than off the phase table for the same reason `reviewingMs` is:
 * the length is a fact about this round, and the table has one figure per pace. */
function scoresMs(state: HostState): number {
  if (state.phase !== 'Reviewing' && state.phase !== 'Scores') {
    return Game.phaseDurationMs('Scores', state.pace);
  }
  return Game.scoresDurationMs(Game.boardCardCount(state));
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

/** The next round's theme choice, from the round that just scored. */
export function nextRoundFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(nextRound(state, Game.phaseDurationMs('Choosing', state.pace)));
}

/** The same phase begun again, from the dock: the room watches the reveal again with nothing
 * rewritten and no vote retaken. */
export function reloadPhaseFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(Game.reducer(state, { type: 'RELOAD_PHASE', startedAt: Date.now() }));
}

/** Wherever the phase table says goes next, which is how the host's clock ends a phase without
 * this file having to know any phase by name. */
export function nextPhaseFrom(host: FlowHost, topic: string): void {
  const state = host.getState();
  if (state === undefined) return;
  const next = Game.phaseAfterCycling(state.phase);
  const durationMs =
    next === 'Reviewing'
      ? reviewingMs(state)
      : next === 'Scores'
        ? scoresMs(state)
        : Game.phaseDurationMs(next, state.pace);
  host.commit(nextPhase(state, next, topic, durationMs));
}
