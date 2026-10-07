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
  PublicChoosingState,
  PublicRoom,
} from './PublicState';

/** One phase of the host's state, as a client is told about it. Every phase sends the roster and
 * the room's pace, so the bar of players runs across the whole game and a client that refreshed
 * mid-round is handed the room back rather than an empty strip. */
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

/** The room's turn and pace, as every phase carries them. */
function room(state: HostState): PublicRoom {
  return { turnPlayerId: state.turnPlayerId, pace: state.pace };
}

export function toPublicLobbyState(state: HostState): PublicLobbyState {
  if (state.phase !== 'Lobby') {
    throw new Error('Invalid state for Lobby');
  }
  return { ...room(state), phase: 'Lobby', players: publicPlayers(state) };
}

export function toPublicChoosingState(state: HostState): PublicChoosingState {
  if (state.phase !== 'Choosing') {
    throw new Error('Invalid state for Choosing');
  }
  return {
    ...room(state),
    phase: 'Choosing',
    durationMs: state.durationMs,
    startedAt: state.startedAt,
    players: publicPlayers(state),
  };
}

export function toPublicWritingState(state: HostState): PublicWritingState {
  if (state.phase !== 'Writing') {
    throw new Error('Invalid state for Writing');
  }
  return {
    ...room(state),
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
  const groups = groupAnswers([...state.answers.values()]).map((group) => ({
    groupId: group.groupId,
    text: group.answers[0],
    playerCount: group.answers.length,
  }));
  return {
    ...room(state),
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
    ...room(state),
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
    ...room(state),
    phase: 'Final',
    durationMs: 0,
    players: publicPlayers(state),
    scores: totalsOf(state.cumulativeScores),
  };
}
