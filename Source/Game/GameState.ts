import { PlayerId, PlayerLook } from '@/Core';

// What the room remembers about one player: who they are and how they look.
export interface Player {
  name: string;
  look: PlayerLook;
}

// Define the internal host state for each phase
export type LobbyState = {
  phase: 'Lobby';
  players: Map<PlayerId, Player>; // playerId -> player record
  cumulativeScores: Map<PlayerId, number>; // cumulative scores across rounds
};

export type WritingState = {
  phase: 'Writing';
  topic: string;
  durationMs: number; // total duration of the writing phase
  startedAt: number; // performance.now() when phase started
  answers: Map<PlayerId, string>; // submitted answers
  cumulativeScores: Map<PlayerId, number>; // cumulative scores across rounds
};

export type ReviewingState = {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  answers: Map<PlayerId, string>; // all answers from writing phase
  // We'll compute groups and track rejections
  groupRejections: Map<number, Set<PlayerId>>; // groupId -> set of playerIds who rejected this group
  cumulativeScores: Map<PlayerId, number>; // cumulative scores across rounds
};

export type ScoresState = {
  phase: 'Scores';
  durationMs: number;
  startedAt: number;
  scores: Map<PlayerId, number>; // scores for this round
  cumulativeScores: Map<PlayerId, number>; // cumulative scores across rounds
};

export type FinalState = {
  phase: 'Final';
  cumulativeScores: Map<PlayerId, number>;
};

export type HostState =
  | LobbyState
  | WritingState
  | ReviewingState
  | ScoresState
  | FinalState;
