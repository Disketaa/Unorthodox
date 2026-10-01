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

export interface Glyph {
  char: string;
  /** Where in the range of mark widths this one falls, as a plain share. */
  scale: number;
  rotation: number;
  depth: number;
  durationS: number;
  delayS: number;
  top: number;
  /** How far past the screen edge this mark's centre sits, as a share of its width. */
  reach: number;
  tone: GlyphTone;
  /** This mark's share of the opacity token, so no two sit at the same depth. */
  fade: number;
}

/**
 * How a mark's width is placed in the range between the two size tokens.
 *
 * Weighted low, because the small end is what the corners and the gaps between
 * marks need, and a band of large marks alone reads as a solid shape rather than
 * as marks.
 */
const ScaleChoices = [0, 0, 0.25, 0.25, 0.5, 0.75, 1];

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
const FadeMax = 0.85;

/**
 * How far past the screen edge a mark's centre may sit, as a share of its own
 * width and scaled by `--Glyph-EdgeReach`.
 *
 * A share of the mark's own width rather than a length, so a mark is placed the
 * same way relative to itself on every screen. The whole range sits inside the
 * mark's own width, so no mark is pushed off the screen far enough to leave the
 * outermost part of the margin bare.
 */
const ReachMinShare = 0.1;
const ReachMaxShare = 0.45;

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
  const scale = ScaleChoices[Math.floor(Math.random() * ScaleChoices.length)] ?? 0.5;
  return {
    char,
    scale,
    rotation: fixedBetween(-RotationDeg, RotationDeg),
    /*
     * This mark's share of the scroll parallax: how far it travels against the
     * page. Widened well past one, because the parallax is now the main thing
     * the field does and it needs real separation between layers to read as
     * depth: a shallow mark barely answers a scroll while a deep one crosses a
     * good share of the viewport, and that spread of speeds is the effect.
     */
    depth: fixedBetween(0.15, 1.6),
    durationS: fixedBetween(DurationMinS, DurationMaxS),
    delayS: fixedBetween(-DurationMaxS, 0),
    top: Number(slotTop(slot).toFixed(2)),
    reach: fixedBetween(ReachMinShare, ReachMaxShare),
    tone,
    fade: fixedBetween(FadeMin, FadeMax),
  };
}

/** One band of marks, rolled fresh. */
export function rollGlyphColumn(): Glyph[] {
  return Array.from({ length: SlotsPerColumn }, (_, slot) => rollGlyph(slot));
}