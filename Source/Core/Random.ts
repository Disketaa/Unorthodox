/** A small reproducible random source. Rolls take a seed rather than reaching for `Math.random`,
 * so an arrangement can be rolled again exactly. The glyph field ships as a list of seeds each
 * looked at before being kept, so a roll ignoring its seed would strand that list. */
export type Random = () => number;

/** The generator for one seed. Every number for one arrangement comes from one of these, so the
 * same seed gives the same sequence: the marks, in the same order, with the same values. */
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

/** The generator for a piece of text rather than a number. FNV-1a, so a room's code is its own
 * seed: every device knowing the code deals the same arrangement, with nothing sent between
 * them. An arrangement every player must see identically cannot come from one player's roll. */
export function randomFor(text: string): Random {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return createRandom(hash);
}
