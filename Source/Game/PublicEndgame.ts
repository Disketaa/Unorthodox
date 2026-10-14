import type { PlayerId } from '@/Core';
import { publicPlayers, room, themeOf } from './PublicPhases';
import type { HostState } from './GameState';
import type { PublicScoresState, PublicFinalState } from './PublicState';

/** A score map as the pairs a client reads, in the room's own order. */
function totalsOf(scores: ReadonlyMap<PlayerId, number>): { id: PlayerId; score: number }[] {
  const totals: { id: PlayerId; score: number }[] = [];
  scores.forEach((score, id) => totals.push({ id, score }));
  return totals;
}

export function toPublicScoresState(state: HostState): PublicScoresState {
  if (state.phase !== 'Scores') {
    throw new Error('Invalid state for Scores');
  }
  return {
    ...room(state),
    phase: 'Scores',
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    scores: totalsOf(state.scores),
    cumulative: totalsOf(state.cumulativeScores),
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
