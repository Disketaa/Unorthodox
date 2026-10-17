/** Deterministic randomness for the balance runs. Seeded, so two formulas meet the same rooms: a
 * table that moved because the dice did is worse than no table, and one that moved because the
 * numbers did is the only kind worth reading. */
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** mulberry32: small, fast and good enough for a simulation nobody is playing. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** A share of the room that is this many players. */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  between(low: number, high: number): number {
    return low + this.next() * (high - low);
  }

  /** An index into `count` slots, which is how a round picks the answer it wants. */
  index(count: number): number {
    return Math.min(count - 1, Math.floor(this.next() * count));
  }
}

/** How many distinct seeds a configuration needs, mixed so two rooms from one run do not share a
 * stream. */
export function seedOf(base: number, ...parts: number[]): number {
  let seed = base >>> 0;
  for (const part of parts) {
    seed = (Math.imul(seed ^ (part + 0x9e3779b9), 0x85ebca6b) ^ (seed >>> 13)) >>> 0;
  }
  return seed;
}
