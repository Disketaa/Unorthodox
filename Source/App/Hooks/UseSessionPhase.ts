import { useRef } from 'preact/hooks';
import { PlayerId } from '@/Core';
import { PublicState } from '@/Game';

export interface SessionPhase {
  phase: 'Connecting' | 'Lobby' | 'Writing' | 'Reviewing' | 'Scores' | 'Final';
  durationMs: number;
  phaseStartedAt: number;
  playerNames: ReadonlyMap<PlayerId, string>;
  playerCount: number;
  submittedCount: number;
}

interface PhaseClock {
  key: string;
  at: number;
}

/** Phase changes are detected by content, so a re-render never restarts a timer. */
function readClock(clock: PhaseClock, key: string): PhaseClock {
  return clock.key === key ? clock : { key, at: performance.now() };
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

/** Read the current phase, and remember when its message arrived. */
export function useSessionPhase(publicState: PublicState | undefined): SessionPhase {
  const namesRef = useRef(new Map<PlayerId, string>());
  const clockRef = useRef<PhaseClock>({ key: '', at: 0 });
  rememberNames(namesRef.current, publicState);

  const phase = publicState?.phase ?? 'Connecting';
  const durationMs = readDurationMs(publicState);
  const clock = readClock(clockRef.current, `${phase}:${durationMs}`);
  clockRef.current = clock;

  return {
    phase,
    durationMs,
    phaseStartedAt: clock.at,
    playerNames: namesRef.current,
    playerCount: namesRef.current.size,
    submittedCount: publicState?.phase === 'Writing' ? publicState.submittedCount : 0,
  };
}
