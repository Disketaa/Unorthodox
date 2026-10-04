import { HostState } from './GameState';
import {
  toPublicFinalState,
  toPublicLobbyState,
  toPublicReviewingState,
  toPublicScoresState,
  toPublicWritingState,
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

export type PublicLobbyState = {
  phase: 'Lobby';
  players: PublicPlayer[];
  /**
   * The pace the host has set.
   *
   * Sent to every client rather than kept on the host, because the settings card is drawn for
   * clients too and a card showing one pace while the room plays another is worse than no card.
   * A client may press the buttons to see what a pace would mean, but what it reads back
   * afterwards is this field and not its own click.
   */
  pace: Pace;
};

export type PublicWritingState = {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  /**
   * When the host started this phase, on the host's clock. Clients must count down from this
   * rather than from when they received the message, otherwise a client that was away when the
   * phase began shows the full time again.
   */
  startedAt: number;
  /** Counts toward the phase, never the answer text: Writing hides answers from clients. */
  submittedCount: number;
  players: PublicPlayer[];
};

export type PublicReviewingState = {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  groups: { groupId: number; text: string; playerCount: number }[];
};

export type PublicScoresState = {
  phase: 'Scores';
  durationMs: number;
  startedAt: number;
  players: PublicPlayer[];
  scores: { id: PlayerId; score: number }[];
  /** The round total per player, which is what the bar of players shows. */
  cumulative: { id: PlayerId; score: number }[];
};

export type PublicFinalState = {
  phase: 'Final';
  durationMs: number;
  players: PublicPlayer[];
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
