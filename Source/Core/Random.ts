/**
 * A small reproducible random source.
 *
 * Rolls take a seed rather than reaching for `Math.random`, so an arrangement can
 * be rolled again exactly. The glyph field is decorative, but it is also the
 * easiest thing in the interface to want to reproduce: it ships as a short list of
 * seeds that were each looked at before being kept, and a roll that ignored its
 * seed would leave that list describing arrangements nobody can get back.
 *
 * The generator is the 32-bit `mulberry32`: a few lines, no dependencies, and good
 * enough for spreading marks out rather than for anything that has to be
 * unpredictable.
 */
export type Random = () => number;

/**
 * The generator for one seed.
 *
 * Every number for one arrangement comes from one of these, so the same seed gives
 * the same sequence: the marks, in the same order, with the same values.
 */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}