import { HostState } from './GameState';
import { groupAnswers } from './Grouping';
import { PlayerId } from '@/Core';

// Define the public state that is sent to clients
export type PublicLobbyState = {
  phase: 'Lobby';
  players: { id: PlayerId; name: string }[];
};

export type PublicWritingState = {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  submittedCount: number; // number of answers submitted so far
};

export type PublicReviewingState = {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  groups: { text: string; playerCount: number }[];
};

export type PublicScoresState = {
  phase: 'Scores';
  durationMs: number;
  scores: { id: PlayerId; score: number }[];
};

export type PublicFinalState = {
  phase: 'Final';
  cumulativeScores: { id: PlayerId; score: number }[];
};

export type PublicState =
  | PublicLobbyState
  | PublicWritingState
  | PublicReviewingState
  | PublicScoresState
  | PublicFinalState;

/**
 * Convert internal host state to public state for clients.
 * @param hostState Internal host state
 * @returns Public state to send to clients
 */
export function toPublicState(hostState: HostState): PublicState {
  switch (hostState.phase) {
    case 'Lobby':
      return toPublicLobbyState(hostState);
    case 'Writing':
      return toPublicWritingState(hostState);
    case 'Reviewing':
      return toPublicReviewingState(hostState);
    case 'Scores':
      return toPublicScoresState(hostState);
    case 'Final':
      return toPublicFinalState(hostState);
    default:
      // The exhaustive switch ensures we never reach here.
      throw new Error(`Unknown state phase: ${hostState.phase}`);
  }
}

function toPublicLobbyState(state: HostState): PublicLobbyState {
  if (state.phase !== 'Lobby') {
    throw new Error('Invalid state for Lobby');
  }
  const playersArray: { id: PlayerId; name: string }[] = [];
  state.players.forEach((name, id) => {
    playersArray.push({ id, name });
  });
  return {
    phase: 'Lobby',
    players: playersArray,
  };
}

function toPublicWritingState(state: HostState): PublicWritingState {
  if (state.phase !== 'Writing') {
    throw new Error('Invalid state for Writing');
  }
  return {
    phase: 'Writing',
    topic: state.topic,
    durationMs: state.durationMs,
    submittedCount: state.answers.size,
  };
}

function toPublicReviewingState(state: HostState): PublicReviewingState {
  if (state.phase !== 'Reviewing') {
    throw new Error('Invalid state for Reviewing');
  }
  // We need to compute groups from the answers.
  const answerTexts = Array.from(state.answers.values());
  const grouped = groupAnswers(answerTexts);
  // Build groups for public state: each group has the answer text and player count.
  // We don't reveal which players submitted which answer.
  const groups = grouped.map(g => ({
    text: g.answers[0], // we can use any answer from the group as the representative text
    playerCount: g.answers.length,
  }));
  return {
    phase: 'Reviewing',
    topic: state.topic,
    durationMs: state.durationMs,
    groups,
  };
}

function toPublicScoresState(state: HostState): PublicScoresState {
  if (state.phase !== 'Scores') {
    throw new Error('Invalid state for Scores');
  }
  const scoresArray: { id: PlayerId; score: number }[] = [];
  state.scores.forEach((score, id) => {
    scoresArray.push({ id, score });
  });
  return {
    phase: 'Scores',
    durationMs: state.durationMs,
    scores: scoresArray,
  };
}

function toPublicFinalState(state: HostState): PublicFinalState {
  if (state.phase !== 'Final') {
    throw new Error('Invalid state for Final');
  }
  const scoresArray: { id: PlayerId; score: number }[] = [];
  state.cumulativeScores.forEach((score, id) => {
    scoresArray.push({ id, score });
  });
  return {
    phase: 'Final',
    durationMs: 0, // not used
    scores: scoresArray,
  };
}