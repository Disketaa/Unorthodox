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
  /** Whose turn it is, in roster order, or null in a room nobody has played in yet. Carried by
   * every phase rather than by one, since a turn is the room's and not the round's. */
  turnPlayerId: PlayerId | null;
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

/** A room with nobody in it and nobody holding the turn. One function rather than three
 * literals, so a new room cannot be shaped differently from a resumed one. */
export function freshLobbyState(): LobbyState {
  return {
    phase: 'Lobby',
    players: new Map(),
    cumulativeScores: new Map(),
    turnPlayerId: null,
    pace: 'Standard',
  };
}
