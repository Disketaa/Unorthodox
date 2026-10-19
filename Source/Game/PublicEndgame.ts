import type { PlayerId } from '@/Core';
import { publicPlayers, room, themeOf, boardOf } from './PublicPhases';
import type { HostState } from './GameState';
import type { PublicScoresState, PublicFinalState } from './PublicState';

/** A score map as the pairs a client reads, in the room's own order. */
function totalsOf(scores: ReadonlyMap<PlayerId, number>): { id: PlayerId; score: number }[] {
  const totals: { id: PlayerId; score: number }[] = [];
  scores.forEach((score, id) => totals.push({ id, score }));
  return totals;
}

/** The round counted, with its board still up. The cards and the room's marks go out again
 * because this phase draws the same screen as the review before it, and a client that found the
 * board gone would be looking at an empty stage. */
export function toPublicScoresState(state: HostState): PublicScoresState {
  if (state.phase !== 'Scores') {
    throw new Error('Invalid state for Scores');
  }
  return {
    ...room(state),
    phase: 'Scores',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    scores: totalsOf(state.scores),
    cumulative: totalsOf(state.cumulativeScores),
    ...boardOf(state, true),
    settled: true,
    // Omitted where the phase has not been begun again, so a resumed room and a fresh one read the
    // same rather than one carrying a zero the other does not.
    ...(state.reloadedAt === undefined ? {} : { reloadedAt: state.reloadedAt }),
    ...themeOf(state),
  };
}

export function toPublicFinalState(state: HostState): PublicFinalState {
  if (state.phase !== 'Final') {
    throw new Error('Invalid state for Final');
  }
  return {
    ...room(state),
    phase: 'Final',
    durationMs: 0,
    players: publicPlayers(state),
    scores: totalsOf(state.cumulativeScores),
    ...themeOf(state),
  };
}
