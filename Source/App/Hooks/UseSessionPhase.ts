import { useRef } from 'preact/hooks';
import { PlayerId, PlayerLook, hostTimeToLocal } from '@/Core';
import { PublicState } from '@/Game';

export interface SessionPhase {
  phase: 'Connecting' | 'Lobby' | 'Writing' | 'Reviewing' | 'Scores' | 'Final';
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
  playerCount: number;
  submittedCount: number;
}

/** Names and looks only reach the public state in the Lobby, so remember them once seen. */
function rememberRoster(
  players: Map<PlayerId, string>,
  looks: Map<PlayerId, PlayerLook>,
  publicState: PublicState | undefined,
): void {
  if (publicState?.phase === 'Lobby') {
    publicState.players.forEach((player) => {
      players.set(player.id, player.name);
      looks.set(player.id, player.look);
    });
  }
}

/** Only the timed phases carry a duration; Lobby and Final have none. */
function readDurationMs(publicState: PublicState | undefined): number {
  return publicState !== undefined && 'durationMs' in publicState ? publicState.durationMs : 0;
}

/** The host's start time of the current phase, or 0 for untimed phases. */
function readStartedAt(publicState: PublicState | undefined): number {
  return publicState !== undefined && 'startedAt' in publicState ? publicState.startedAt : 0;
}

/** Read the current phase, the host's clock, and the roster seen so far. */
export function useSessionPhase(
  publicState: PublicState | undefined,
  clockOffsetMs: number,
): SessionPhase {
  const namesRef = useRef(new Map<PlayerId, string>());
  const looksRef = useRef(new Map<PlayerId, PlayerLook>());
  rememberRoster(namesRef.current, looksRef.current, publicState);

  return {
    phase: publicState?.phase ?? 'Connecting',
    durationMs: readDurationMs(publicState),
    phaseStartedAt: hostTimeToLocal(readStartedAt(publicState), clockOffsetMs),
    clockOffsetMs,
    playerNames: namesRef.current,
    playerLooks: looksRef.current,
    playerCount: namesRef.current.size,
    submittedCount: publicState?.phase === 'Writing' ? publicState.submittedCount : 0,
  };
}
