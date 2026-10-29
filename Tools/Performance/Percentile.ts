/** The q-th percentile of a sorted array, where q is in [0, 1]. */
export function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[index] ?? 0;
}
