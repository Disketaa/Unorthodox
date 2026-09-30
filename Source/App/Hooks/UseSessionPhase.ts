import { useRef } from 'preact/hooks';
import { PlayerId, hostTimeToLocal } from '@/Core';
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
  playerCount: number;
  submittedCount: number;
}

/** Names only reach the public state in the Lobby, so remember them once seen. */
function rememberNames(
  names: Map<PlayerId, string>,
  publicState: PublicState | undefined,
): void {
  if (publicState?.phase === 'Lobby') {
    publicState.players.forEach((player) => names.set(player.id, player.name));
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

/** Read the current phase, the host's clock, and the names seen so far. */
export function useSessionPhase(
  publicState: PublicState | undefined,
  clockOffsetMs: number,
): SessionPhase {
  const namesRef = useRef(new Map<PlayerId, string>());
  const offsetRef = useRef(clockOffsetMs);
  offsetRef.current = clockOffsetMs;
  rememberNames(namesRef.current, publicState);

  return {
    phase: publicState?.phase ?? 'Connecting',
    durationMs: readDurationMs(publicState),
    phaseStartedAt: hostTimeToLocal(readStartedAt(publicState), clockOffsetMs),
    clockOffsetMs,
    playerNames: namesRef.current,
    playerCount: namesRef.current.size,
    submittedCount: publicState?.phase === 'Writing' ? publicState.submittedCount : 0,
  };
}
