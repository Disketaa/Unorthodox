import { PlayerId } from '@/Core';
import { HostState } from './GameState';
import { groupAnswers } from './Grouping';
import type {
  PublicFinalState,
  PublicLobbyState,
  PublicPlayer,
  PublicReviewingState,
  PublicScoresState,
  PublicWritingState,
} from './PublicState';

/**
 * One phase of the host's state, as a client is told about it.
 *
 * Every phase sends the roster, and that is the change from the lobby-only
 * version: the bar of players runs across the whole game rather than appearing
 * in the lobby and vanishing at the first topic, and a client that refreshed
 * mid-round is handed the room back instead of an empty strip. None of it is
 * new information — a name, a face and whether that player is still connected
 * were all already on the wire in the lobby.
 */
function publicPlayers(state: HostState): PublicPlayer[] {
  const players: PublicPlayer[] = [];
  state.players.forEach((player, id) => {
    players.push({ id, name: player.name, look: player.look, isOnline: player.isOnline });
  });
  return players;
}

/** A score map as the pairs a client reads, in the room's own order. */
function totalsOf(scores: ReadonlyMap<PlayerId, number>): { id: PlayerId; score: number }[] {
  const totals: { id: PlayerId; score: number }[] = [];
  scores.forEach((score, id) => totals.push({ id, score }));
  return totals;
}

export function toPublicLobbyState(state: HostState): PublicLobbyState {
  if (state.phase !== 'Lobby') {
    throw new Error('Invalid state for Lobby');
  }
  return { phase: 'Lobby', players: publicPlayers(state), pace: state.pace };
}

export function toPublicWritingState(state: HostState): PublicWritingState {
  if (state.phase !== 'Writing') {
    throw new Error('Invalid state for Writing');
  }
  return {
    phase: 'Writing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    submittedCount: state.answers.size,
    players: publicPlayers(state),
  };
}

export function toPublicReviewingState(state: HostState): PublicReviewingState {
  if (state.phase !== 'Reviewing') {
    throw new Error('Invalid state for Reviewing');
  }
  // The representative text is whichever answer in the group was read first: the room
  // shows one answer per group and never says which of them wrote it.
  const groups = groupAnswers([...state.answers.values()]).map((group) => ({
    groupId: group.groupId,
    text: group.answers[0],
    playerCount: group.answers.length,
  }));
  return {
    phase: 'Reviewing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    groups,
  };
}

export function toPublicScoresState(state: HostState): PublicScoresState {
  if (state.phase !== 'Scores') {
    throw new Error('Invalid state for Scores');
  }
  return {
    phase: 'Scores',
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
    scores: totalsOf(state.scores),
    cumulative: totalsOf(state.cumulativeScores),
  };
}

export function toPublicFinalState(state: HostState): PublicFinalState {
  if (state.phase !== 'Final') {
    throw new Error('Invalid state for Final');
  }
  return {
    phase: 'Final',
    durationMs: 0,
    players: publicPlayers(state),
    scores: totalsOf(state.cumulativeScores),
  };
}