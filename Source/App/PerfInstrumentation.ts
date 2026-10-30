import { options } from 'preact';

/** The slice of the browser run's sink this file writes to. The run installs the rest. */
interface PerfSink {
  phase: string;
  renders: Record<string, Record<string, number>>;
  flushes: { phase: string; ms: number }[];
}

declare global {
  interface Window {
    __perf?: PerfSink;
  }
}

/** Count renders and render flushes for the browser performance run only. */
export function installPerfInstrumentation(): void {
  const sink = window.__perf;
  if (sink === undefined) return;

  const previousDiffed = options.diffed;
  options.diffed = (vnode) => {
    const type = vnode.type;
    if (typeof type === 'function') {
      const byPhase = sink.renders[sink.phase] ?? {};
      byPhase[type.name || 'Anonymous'] = (byPhase[type.name || 'Anonymous'] ?? 0) + 1;
      sink.renders[sink.phase] = byPhase;
    }
    previousDiffed?.(vnode);
  };

  const schedule =
    options.debounceRendering ??
    ((callback: () => void) => {
      void Promise.resolve().then(callback);
    });
  options.debounceRendering = (callback) => {
    schedule(() => {
      const start = performance.now();
      callback();
      sink.flushes.push({ phase: sink.phase, ms: performance.now() - start });
    });
  };
}
