import { PlayerId, PlayerLook } from '@/Core';
import { Pace } from './GameConfig';

/** What the room remembers about one player: who they are, how they look, and whether they are
 * still on the line. Presence is the host's to record, because only the host sees every peer
 * connect and drop. */
export interface Player {
  name: string;
  look: PlayerLook;
  isOnline: boolean;
}

/** What every phase carries, whatever the room is doing. The roster and the totals outlive the
 * phase, and have to: a player who refreshes mid-round is let back in because their seat is
 * still here, and the standings are the totals of every round. */
export interface RoomMembers {
  players: Map<PlayerId, Player>;
  cumulativeScores: Map<PlayerId, number>;
}

export type LobbyState = RoomMembers & {
  phase: 'Lobby';
  /** The pace the host has set, which every player reads from the public state. In the state
   * rather than the UI, so a client is told the answer rather than guessing it from its own
   * click. The buttons are drawn for clients too, to show what a pace would mean. */
  pace: Pace;
};

export type WritingState = RoomMembers & {
  phase: 'Writing';
  topic: string;
  durationMs: number;
  startedAt: number;
  answers: Map<PlayerId, string>;
};

export type ReviewingState = RoomMembers & {
  phase: 'Reviewing';
  topic: string;
  durationMs: number;
  startedAt: number;
  answers: Map<PlayerId, string>;
  /** groupId -> the playerIds who voted that group not suitable */
  groupRejections: Map<number, Set<PlayerId>>;
};

export type ScoresState = RoomMembers & {
  phase: 'Scores';
  durationMs: number;
  startedAt: number;
  scores: Map<PlayerId, number>;
};

export type FinalState = RoomMembers & {
  phase: 'Final';
};

export type HostState =
  | LobbyState
  | WritingState
  | ReviewingState
  | ScoresState
  | FinalState;