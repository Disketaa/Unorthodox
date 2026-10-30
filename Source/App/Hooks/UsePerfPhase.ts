import { useEffect } from 'preact/hooks';
import { reportPhase } from '@/Core';

/** Tell the browser performance run which phase the room has entered. */
export function usePerfPhase(phase: string): void {
  useEffect(() => {
    reportPhase(phase);
  }, [phase]);
}
