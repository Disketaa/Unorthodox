/** A running tally of frame timings, used to compute FPS and detect slow frames. */
export interface FrameStats {
  /** How many frames were measured. */
  readonly count: number;
  /** The average frame duration, in milliseconds. */
  readonly averageMs: number;
  /** The slowest frame observed, in milliseconds. */
  readonly maxMs: number;
  /** The 95th percentile frame duration, in milliseconds. */
  readonly p95Ms: number;
  /** How many frames exceeded the slow-frame threshold. */
  readonly slowFrames: number;
}

/** How long a frame may take before it counts as slow, in milliseconds. */
export const SlowFrameMs = 16;

/** Measures frame timing by wrapping a work callback. Each call to `tick` records one frame. */
export class FrameTimer {
  private readonly timings: number[] = [];

  /** Run one frame: time the work, then record its duration. */
  tick(work: () => void): void {
    const start = performance.now();
    work();
    this.timings.push(performance.now() - start);
  }

  /** Compute statistics from all recorded frames. */
  stats(): FrameStats {
    let total = 0;
    let max = 0;
    let slow = 0;
    for (const duration of this.timings) {
      total += duration;
      if (duration > max) max = duration;
      if (duration > SlowFrameMs) slow += 1;
    }
    const count = this.timings.length;
    const average = count === 0 ? 0 : total / count;
    const sorted = [...this.timings].sort((a, b) => a - b);
    const p95 =
      count === 0 ? 0 : sorted[Math.min(count - 1, Math.floor(count * 0.95))] ?? 0;
    return {
      count,
      averageMs: average,
      maxMs: max,
      p95Ms: p95,
      slowFrames: slow,
    };
  }

  /** Clear all recorded frames. */
  reset(): void {
    this.timings.length = 0;
  }
}
