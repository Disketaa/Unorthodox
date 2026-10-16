/** The host's own moves between phases, kept out of the session so the file that owns the roster
 * owns none of the round flow. Every duration is read from the phase table here rather than
 * passed in, so a phase cannot be entered at a length the table does not give it. */
import * as Game from '@/Game';
import type { HostState } from '@/Game';
import type { PlayerId, ThemeRef } from '@/Core';
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

/** Start a round: out of the theme choice and into answering it. */
export function startWritingFrom(host: FlowHost, topic: string): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(startWriting(state, topic, Game.phaseDurationMs('Writing', state.pace)));
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
  theme: ThemeRef,
  playerId: PlayerId
): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(chooseTheme(state, roomCode, theme, playerId));
}

/** How long the reviewing round runs for the room: a floor for being in it at all вЂ” five seconds
 * briskly, ten slowly вЂ” and five more for every player after the first. Read here rather than
 * off the phase table, which has one figure per pace where the room needs one per room size. */
function reviewingMs(state: HostState): number {
  if (state.phase !== 'Writing') return Game.phaseDurationMs('Reviewing', state.pace);
  return Game.reviewingDurationMs(state.players.size, state.pace);
}

/** Advance out of Writing once everyone has answered, or out of Reviewing once its clock is up.
 * Which is read off the phase the room is in, since a late message can ask for either. The
 * length passed in is only the length of the phase being closed. */
export function endReviewingFrom(host: FlowHost, durationMs: number): void {
  const state = host.getState();
  if (state === undefined) return;
  const next =
    state.phase === 'Writing'
      ? closeWriting(state, reviewingMs(state), host.expectedAnswers())
      : closeReviewing(state, durationMs);
  host.commit(next);
}

/** The next round's theme choice, from the round that just scored. */
export function nextRoundFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(nextRound(state, Game.phaseDurationMs('Choosing', state.pace)));
}

/** Wherever the phase table says goes next, which is how the host's clock ends a phase without
 * this file having to know any phase by name. */
export function nextPhaseFrom(host: FlowHost, topic: string): void {
  const state = host.getState();
  if (state === undefined) return;
  const next = Game.phaseAfterCycling(state.phase);
  const durationMs =
    next === 'Reviewing' ? reviewingMs(state) : Game.phaseDurationMs(next, state.pace);
  host.commit(nextPhase(state, next, topic, durationMs));
}
