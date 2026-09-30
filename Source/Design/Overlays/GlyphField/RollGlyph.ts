/**
 * The pool of marks used to fill the margins.
 *
 * Symbols only. Letters at this size stop reading as texture and start reading
 * as words, and words in the margins are what the centre column has to be free
 * of. Every one of these is in BlobSpongey itself, so nothing falls through to
 * the body face and breaks the look of the field.
 */
const Symbols = ['@', '#', '$', '%', '&', '*', '+', '=', '?', '!', '~', ';', ':', '/', '\\', '^'];

/** How many marks along one band, and so how finely the height is divided. */
const SlotsPerColumn = 22;

export type GlyphTone = 'Light' | 'Mid' | 'Deep';

/**
 * The three absolute sizes a mark is drawn at.
 *
 * Named rather than rolled, because a mark is a fixed size rather than a
 * multiple of one: its size is a length in `Tokens.css` that the same on every
 * screen and at every zoom level, so nothing in the field grows with the page
 * or shrinks away from it.
 */
export type GlyphSize = 'Small' | 'Medium' | 'Large';

export interface Glyph {
  char: string;
  size: GlyphSize;
  rotation: number;
  depth: number;
  durationS: number;
  delayS: number;
  top: number;
  /**
   * How far in from the band's outer edge this mark starts, as a share of the
   * band's width. The stylesheet anchors it to the left edge or the right edge
   * of the band, which is what lets one number serve both sides.
   */
  inward: number;
  tone: GlyphTone;
  /** This mark's share of the opacity token, so no two sit at the same depth. */
  fade: number;
}

/**
 * Which of the three sizes a mark is drawn at, weighted so the band is mostly
 * the smaller two and the large one is what stops it reading as a pattern.
 */
const Sizes: readonly GlyphSize[] = [
  'Small',
  'Small',
  'Small',
  'Medium',
  'Medium',
  'Large',
];

const RotationDeg = 24;
const DurationMinS = 16;
const DurationMaxS = 34;

/**
 * How far a mark may sit outside the slot it was given, as a share of the band.
 *
 * Narrow, because the slots are already even. This is the difference between
 * an even spread that still looks laid out by hand and a scatter with holes in
 * it: the slots decide where a mark belongs, and only the jitter is random.
 */
const JitterPercent = 22;

/**
 * How much paler than full a mark may be, as a share of the opacity token.
 *
 * The tone already says how dark a mark is; this is the second, separate axis,
 * so the band has marks that differ in weight as well as in value. Without it a
 * band of one tone reads as a flat screen of the same mark rather than as a
 * crowd at different distances.
 */
const FadeMin = 0.35;
const FadeMax = 1.25;

/**
 * How far a mark's centre may sit from the screen edge, as a share of the band's
 * width. Negative, so the centres are off the edge of the screen and every mark
 * leans out of it rather than in.
 *
 * Measured from the edge rather than across the band, and deliberately past it,
 * because a mark is far wider than a band: a centre placed on the edge would put
 * half the mark over the middle, and a centre placed inside the band would put
 * all of it there. Anchoring the centres beyond the edge is what makes the outer
 * fifteen per cent the dense part and the middle clear, with the marks thinning
 * as they travel inward on their own.
 */
const InwardMaxPercent = -30;
const InwardMinPercent = -70;

/**
 * Which edge of the screen a band hangs from.
 *
 * The same marks serve both bands; only the edge they are anchored to differs,
 * which is what keeps the two sides the same arrangement rather than two
 * independently rolled ones that happen to look alike.
 */
export type GlyphSide = 'Left' | 'Right';

const Tones: readonly GlyphTone[] = ['Light', 'Light', 'Mid', 'Mid', 'Deep'];

/** A number anywhere in a range. */
function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** A number anywhere in a range, rounded to two decimals. */
function fixedBetween(min: number, max: number): number {
  return Number(between(min, max).toFixed(2));
}

/**
 * One slot's centre along the band, in percent.
 *
 * Divided by the slot count and spread over the band rather than over the
 * viewport, so the marks are dense everywhere the band is tall. The overflow
 * past the ends is deliberate: it is what hides the last slot's gap at the
 * bottom edge.
 */
function slotTop(slot: number): number {
  const step = 100 / SlotsPerColumn;
  const jitter = (Math.random() * 2 - 1) * JitterPercent;
  return step * (slot + 0.5) + jitter;
}

/** One mark at random, in the slot it was given. */
export function rollGlyph(slot: number): Glyph {
  const char = Symbols[Math.floor(Math.random() * Symbols.length)] ?? '#';
  const tone = Tones[Math.floor(Math.random() * Tones.length)] ?? 'Light';
  const size = Sizes[Math.floor(Math.random() * Sizes.length)] ?? 'Medium';
  return {
    char,
    size,
    rotation: fixedBetween(-RotationDeg, RotationDeg),
    depth: fixedBetween(0.2, 1),
    durationS: fixedBetween(DurationMinS, DurationMaxS),
    delayS: fixedBetween(-DurationMaxS, 0),
    top: Number(slotTop(slot).toFixed(2)),
    inward: fixedBetween(InwardMinPercent, InwardMaxPercent),
    tone,
    fade: fixedBetween(FadeMin, FadeMax),
  };
}

/** One band of marks, rolled fresh. */
export function rollGlyphColumn(): Glyph[] {
  return Array.from({ length: SlotsPerColumn }, (_, slot) => rollGlyph(slot));
}