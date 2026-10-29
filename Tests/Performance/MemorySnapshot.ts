import type { MemorySnapshot, MemoryDelta } from '../../Tools/Performance/types';

/** True where the runtime exposes a garbage collector hook. */
function hasGc(): boolean {
  return typeof gc === 'function';
}

/** Force a garbage collection and return the heap used, or undefined where GC is not exposed. */
function heapUsedAfterGc(): number | undefined {
  if (!hasGc()) return undefined;
  gc?.();
  if (typeof process === 'undefined') return undefined;
  const memoryUsage = process.memoryUsage;
  if (typeof memoryUsage !== 'function') return undefined;
  return memoryUsage().heapUsed;
}

/** Take one snapshot of the measurable state. */
export function takeSnapshot(): MemorySnapshot {
  return {
    globalKeys: Object.keys(globalThis).length,
    heapUsedJsBytes: heapUsedAfterGc(),
  };
}

/** Compare two snapshots and return the growth between them. */
export function snapshotDelta(first: MemorySnapshot, second: MemorySnapshot): MemoryDelta {
  return {
    globalKeys: second.globalKeys - first.globalKeys,
    heapUsedJsBytes:
      second.heapUsedJsBytes === undefined || first.heapUsedJsBytes === undefined
        ? undefined
        : second.heapUsedJsBytes - first.heapUsedJsBytes,
  };
}
