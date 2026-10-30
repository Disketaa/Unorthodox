/** Optional counters a browser performance run installs before the app loads. Every hook is a
 * no-op without one, and without a window at all: a test runner in node runs the same code. */
declare global {
  interface Window {
    __perfPhase?: (phase: string) => void;
    __perfWire?: (direction: 'tx' | 'rx', type: string, bytes: number) => void;
    __perfCommit?: () => void;
    __perfAudit?: { push: (entry: unknown) => void };
    __perfJump?: (phase: string) => void;
  }
}

/** The page's hooks, or nothing where there is no page. */
function perf(): Window | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

/** Tell the run which phase the room has entered. */
export function reportPhase(phase: string): void {
  perf()?.__perfPhase?.(phase);
}

/** Count one game message at the transport boundary, with the bytes it took. */
export function reportWire(direction: 'tx' | 'rx', message: unknown, bytes: number): void {
  perf()?.__perfWire?.(direction, messageType(message), bytes);
}

/** Count one host state commit, which is what a broadcast is allowed to follow. */
export function reportCommit(): void {
  perf()?.__perfCommit?.();
}

/** Note the phase the host has committed, and when, for the run's ordering audit. */
export function reportCommitAt(phase: string, at: number): void {
  perf()?.__perfAudit?.push({ phase, at });
}

function messageType(message: unknown): string {
  if (typeof message !== 'object' || message === null) return 'unknown';
  if (!('type' in message)) return 'unknown';
  const type = message.type;
  return typeof type === 'string' ? type : 'unknown';
}
