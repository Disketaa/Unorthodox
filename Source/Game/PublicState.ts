import { HostState } from './GameState';
import {
  toPublicFinalState,
  toPublicLobbyState,
  toPublicReviewingState,
  toPublicScoresState,
  toPublicWritingState,
  toPublicChoosingState,
} from './PublicPhases';
import { PlayerId, PlayerLook, assertNever } from '@/Core';
import type { Pace } from './GameConfig';

/** What a client is told about one player. */
export interface PublicPlayer {
  id: PlayerId;
  name: string;
  look: PlayerLook;
  /** Whether the host still has this player on the line. */
  isOnline: boolean;
}

/** What every phase tells a client about the room itself. The turn and the pace ride on all of
 * them rather than on one, because they outlive phases and the bar of players reads them in
 * every one. */
export interface PublicRoom {
  /** Whose turn it is, or null in a room nobody has played in yet. */
  turnPlayerId: PlayerId | null;
  /** The pace the host has set, which every phase is timed against. Sent to every client because
   * the settings card is drawn for clients too, and a card showing one pace while the room
   * plays another is worse than no card. */
  pace: Pace;
}

export type PublicLobbyState = PublicRoom & {
  phase: 'Lobby';
  players: PublicPlayer[];
};

export type PublicChoosingState = PublicRoom & {
  phase: 'Choosing';
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
};

export type PublicWritingState = PublicRoom & {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  startedAt: number;
  submittedCount: number;
  players: PublicPlayer[];
};

export type PublicReviewingState = PublicRoom & {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  groups: { groupId: number; text: string; playerCount: number }[];
};

export type PublicScoresState = PublicRoom & {
  phase: 'Scores';
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  scores: { id: PlayerId; score: number }[];
  /** The round total per player, which is what the bar of players shows. */
  cumulative: { id: PlayerId; score: number }[];
};

export type PublicFinalState = PublicRoom & {
  phase: 'Final';
  durationMs: number;
  players: PublicPlayer[];
  scores: { id: PlayerId; score: number }[];
};

export type PublicState =
  | PublicLobbyState
  | PublicChoosingState
  | PublicWritingState
  | PublicReviewingState
  | PublicScoresState
  | PublicFinalState;

export function toPublicState(hostState: HostState): PublicState {
  switch (hostState.phase) {
    case 'Lobby':
      return toPublicLobbyState(hostState);
    case 'Choosing':
      return toPublicChoosingState(hostState);
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
