/** The host's own moves between phases, kept out of the session so the file that owns the roster
 * owns none of the round flow. Every duration is read from the phase table here rather than
 * passed in, so a phase cannot be entered at a length the table does not give it. */
import * as Game from '@/Game';
import type { HostState } from '@/Game';
import {
  startGame,
  startWriting,
  startRandomPick,
  resolveRandomPick,
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
 * * just left, and the theme clock starts the instant Start is pressed, so the first Choosing
 * is given this much extra. Later rounds have no count-in to pay for. */
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
export function resolveRandomPickFrom(host: FlowHost): void {
  const state = host.getState();
  if (state === undefined) return;
  host.commit(resolveRandomPick(state));
}

/** Advance out of Writing once everyone has answered, or out of Reviewing once its clock is up.
 * Which is read off the phase the room is in, since a late message can ask for either. The
 * length is the caller's: only Writing's clock knows how long the round it is closing ran. */
export function endReviewingFrom(host: FlowHost, durationMs: number): void {
  const state = host.getState();
  if (state === undefined) return;
  const next =
    state.phase === 'Writing'
      ? closeWriting(state, durationMs, host.expectedAnswers())
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
  host.commit(nextPhase(state, next, topic, Game.phaseDurationMs(next, state.pace)));
}
