import { PlayerId, PlayerLook, hostTimeToLocal } from '@/Core';
import { PublicPlayer, PublicState } from '@/Game';

/** Every phase a player can be in, which is what the screens are chosen from. */
export type SessionPhaseName = 'Connecting' | 'Lobby' | 'Writing' | 'Reviewing' | 'Scores' | 'Final';

export interface SessionPhase {
  phase: SessionPhaseName;
  durationMs: number;
  /**
   * When the phase started, on this device's clock.
   *
   * The host's own start time is used, converted through the measured clock
   * offset. Counting from the moment the message arrived would restart the
   * countdown for a client that joined late or was suspended and caught up.
   */
  phaseStartedAt: number;
  /** Skew between the host's clock and this device's. */
  clockOffsetMs: number;
  playerNames: ReadonlyMap<PlayerId, string>;
  playerLooks: ReadonlyMap<PlayerId, PlayerLook>;
  /** Who is still on the line, which only the host can see change. */
  playerPresence: ReadonlyMap<PlayerId, boolean>;
  playerCount: number;
  submittedCount: number;
}

/**
 * The room, read as the three lookups the screens ask it for.
 *
 * The roster arrives in every phase rather than only in the lobby, so this is
 * derived from the state on every render instead of being accumulated in a ref:
 * a client that refreshed mid-round is handed the room back by the state it is
 * sent, and a device that has not been sent one yet draws an empty bar for the
 * moment before it has.
 */
function readRoster(players: readonly PublicPlayer[]) {
  const names = new Map<PlayerId, string>();
  const looks = new Map<PlayerId, PlayerLook>();
  const presence = new Map<PlayerId, boolean>();
  players.forEach((player) => {
    names.set(player.id, player.name);
    looks.set(player.id, player.look);
    presence.set(player.id, player.isOnline);
  });
  return { names, looks, presence };
}

/** Only the timed phases carry a duration; Lobby and Final have none. */
function readDurationMs(publicState: PublicState | undefined): number {
  return publicState !== undefined && 'durationMs' in publicState ? publicState.durationMs : 0;
}

/** The host's start time of the current phase, or 0 for untimed phases. */
function readStartedAt(publicState: PublicState | undefined): number {
  return publicState !== undefined && 'startedAt' in publicState ? publicState.startedAt : 0;
}

/** Read the current phase, the host's clock, and the room as it stands. */
export function useSessionPhase(
  publicState: PublicState | undefined,
  clockOffsetMs: number,
): SessionPhase {
  const roster = readRoster(publicState?.players ?? []);

  return {
    phase: publicState?.phase ?? 'Connecting',
    durationMs: readDurationMs(publicState),
    phaseStartedAt: hostTimeToLocal(readStartedAt(publicState), clockOffsetMs),
    clockOffsetMs,
    playerNames: roster.names,
    playerLooks: roster.looks,
    playerPresence: roster.presence,
    playerCount: roster.names.size,
    submittedCount: publicState?.phase === 'Writing' ? publicState.submittedCount : 0,
  };
}