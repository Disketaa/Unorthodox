/** A pointer position at a moment, kept only to work out how fast it is going. */
export interface MotionSample {
  x: number;
  at: number;
}

/** Most samples kept, so a long slow drag does not grow the buffer. */
const MaxSamples = 12;
/**
 * Shortest gap between two samples worth dividing by, in milliseconds.
 *
 * Browsers can deliver two pointermove events with almost no time between them,
 * and dividing by a gap that short turns a rounding difference into a huge speed.
 * When the samples are that close the older one is skipped and the search carries
 * on backwards, which is what makes a flick that arrived as two events still read
 * as the throw it was.
 */
const MinIntervalMs = 16;

/**
 * Works out how fast a pointer is travelling, from the most recent gap that is
 * long enough to measure.
 *
 * Measuring between the last two events alone is not enough: browsers coalesce
 * pointermove, so a sharp flick can arrive as two events a long way apart, and
 * averaging over whatever the browser did send is the only way to see the speed
 * that was actually there. The older samples matter as much as the recent ones,
 * so a slow start does not drag the reading down.
 */
export class SpeedTracker {
  private samples: MotionSample[] = [];

  reset(x: number, at: number): void {
    this.samples = [{ x, at }];
  }

  add(x: number, at: number): void {
    this.samples = [...this.samples, { x, at }].slice(-MaxSamples);
  }

  /** Pixels per millisecond, positive when the pointer is travelling left. */
  velocity(): number {
    const last = this.samples[this.samples.length - 1];
    if (last === undefined) {
      return 0;
    }
    for (let index = this.samples.length - 2; index >= 0; index -= 1) {
      const anchor = this.samples[index];
      if (anchor === undefined) {
        continue;
      }
      const elapsed = last.at - anchor.at;
      if (elapsed < MinIntervalMs) {
        continue;
      }
      return (anchor.x - last.x) / elapsed;
    }
    return 0;
  }
}