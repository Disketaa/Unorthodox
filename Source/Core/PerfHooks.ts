/** Optional counters a browser performance run installs before the app loads. Every hook is a
 * no-op without one, so the app carries no cost when nothing is listening. */
declare global {
  interface Window {
    __perfPhase?: (phase: string) => void;
    __perfWire?: (direction: 'tx' | 'rx', type: string, bytes: number) => void;
    __perfCommit?: () => void;
  }
}

/** Tell the run which phase the room has entered. */
export function reportPhase(phase: string): void {
  window.__perfPhase?.(phase);
}

/** Count one game message at the transport boundary, with the bytes it took. */
export function reportWire(direction: 'tx' | 'rx', message: unknown, bytes: number): void {
  window.__perfWire?.(direction, messageType(message), bytes);
}

/** Count one host state commit, which is what a broadcast is allowed to follow. */
export function reportCommit(): void {
  window.__perfCommit?.();
}

function messageType(message: unknown): string {
  if (typeof message !== 'object' || message === null) return 'unknown';
  if (!('type' in message)) return 'unknown';
  const type = message.type;
  return typeof type === 'string' ? type : 'unknown';
}
