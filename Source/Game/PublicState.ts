import { HostState } from './GameState';
import { groupAnswers } from './Grouping';
import { PlayerId, PlayerLook, assertNever } from '@/Core';

// What a client is told about one player.
export interface PublicPlayer {
  id: PlayerId;
  name: string;
  look: PlayerLook;
  /** Whether the host still has this player on the line. */
  isOnline: boolean;
}

export type PublicLobbyState = {
  phase: 'Lobby';
  players: PublicPlayer[];
};

export type PublicWritingState = {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  /**
   * When the host started this phase, on the host's clock. Clients must count
   * down from this rather than from when they received the message, otherwise a
   * client that was away when the phase began shows the full time again.
   */
  startedAt: number;
  submittedCount: number; // number of answers submitted so far
};

export type PublicReviewingState = {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  groups: { groupId: number; text: string; playerCount: number }[];
};

export type PublicScoresState = {
  phase: 'Scores';
  durationMs: number;
  startedAt: number;
  scores: { id: PlayerId; score: number }[];
};

export type PublicFinalState = {
  phase: 'Final';
  durationMs: number;
  scores: { id: PlayerId; score: number }[];
};

export type PublicState =
  | PublicLobbyState
  | PublicWritingState
  | PublicReviewingState
  | PublicScoresState
  | PublicFinalState;

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
      return assertNever(hostState);
  }
}

function toPublicLobbyState(state: HostState): PublicLobbyState {
  if (state.phase !== 'Lobby') {
    throw new Error('Invalid state for Lobby');
  }
  const playersArray: PublicPlayer[] = [];
  state.players.forEach((player, id) => {
    playersArray.push({
      id,
      name: player.name,
      look: player.look,
      isOnline: player.isOnline,
    });
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
    startedAt: state.startedAt,
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
    groupId: g.groupId,
    text: g.answers[0], // we can use any answer from the group as the representative text
    playerCount: g.answers.length,
  }));
  return {
    phase: 'Reviewing',
    topic: state.topic,
    durationMs: state.durationMs,
    startedAt: state.startedAt,
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
    startedAt: state.startedAt,
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