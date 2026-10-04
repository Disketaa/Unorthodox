import type { Random } from '@/Core';

/**
 * The pool of marks used to fill the margins.
 *
 * Symbols only. Letters at this size stop reading as texture and start reading
 * as words, and words in the margins are what the centre column has to be free
 * of. Every one of these is in BlobSpongey itself, so nothing falls through to
 * the body face and breaks the look of the field.
 */
const Symbols = ['@', '#', '$', '%', '&', '*', '+', '=', '?', '!', '~', ';', ':', '/', '\\', '^'];

/**
 * How many marks along one band, and so how finely the height is divided.
 *
 * Doubled from twenty-two. A mark is much wider than it is tall, so the band
 * was reading as a few large shapes with gaps between them rather than as a
 * crowd, and the fix is more marks rather than smaller ones: a smaller mark on
 * a phone is barely larger than the body text it sits behind.
 */
export const SlotsPerBand = 44;

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
 * marks need, and a band of large marks alone reads as a solid shape rather
 * than as marks.
 */
const ScaleChoices = [0, 0, 0.25, 0.25, 0.5, 0.75, 1];

const RotationDeg = 24;
const DurationMinS = 16;
const DurationMaxS = 34;

/**
 * How far a mark may sit outside the slot it was given, as a share of the step
 * between two slots.
 *
 * Narrow, because the slots are already even. This is the difference between an
 * even spread that still looks laid out by hand and a scatter with holes in it:
 * the slots decide where a mark belongs, and only the jitter is random.
 *
 * A share of the step and not of the band, which is what keeps the arrangement
 * the same shape at any density: doubling the slots halves the step, and a
 * jitter held at the old share of the band would then span four slots and land
 * marks on top of each other. A mark may cross into its neighbour's slot, never
 * past it.
 */
const JitterShare = 0.35;

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
function between(min: number, max: number, random: Random): number {
  return min + random() * (max - min);
}

/** A number anywhere in a range, rounded to two decimals. */
function fixedBetween(min: number, max: number, random: Random): number {
  return Number(between(min, max, random).toFixed(2));
}

/**
 * One slot's centre along the band, in percent.
 *
 * Divided by the slot count and spread over the band rather than over the
 * viewport, so the marks are dense everywhere the band is tall.
 *
 * The slots are spread across the whole band, first on its top edge and last on
 * its bottom edge, rather than sitting half a step in from each end. The band
 * is pulled past both screen edges by `--Glyph-Overscan`, so a slot on the
 * band's own end lands well above the screen and well below it: that is what
 * carries the field off the top and the bottom rather than stopping at them,
 * and it also spaces the marks evenly over what is actually visible instead of
 * bunching them in the middle.
 */
function slotTop(slot: number, random: Random): number {
  const jitter = (random() * 2 - 1) * slotStep() * JitterShare;
  return (100 * slot) / (SlotsPerBand - 1) + jitter;
}

/** The distance between two slots, as a share of the band. */
function slotStep(): number {
  return 100 / (SlotsPerBand - 1);
}

/**
 * One mark at random, in the slot it was given.
 *
 * The generator is passed in rather than reached for, the way a look is rolled
 * in Core, so one seed decides the whole field and the field can be rolled
 * again from the seed that was reported for it.
 */
export function rollGlyph(slot: number, random: Random): Glyph {
  const char = Symbols[Math.floor(random() * Symbols.length)] ?? '#';
  const tone = Tones[Math.floor(random() * Tones.length)] ?? 'Light';
  const scale = ScaleChoices[Math.floor(random() * ScaleChoices.length)] ?? 0.5;
  return {
    char,
    scale,
    rotation: fixedBetween(-RotationDeg, RotationDeg, random),
    // Share of the scroll parallax. Widened past one because the field needs real speed
    // separation between layers before it reads as depth rather than as scattered marks.
    depth: fixedBetween(0.15, 1.6, random),
    durationS: fixedBetween(DurationMinS, DurationMaxS, random),
    delayS: fixedBetween(-DurationMaxS, 0, random),
    top: Number(slotTop(slot, random).toFixed(2)),
    reach: fixedBetween(ReachMinShare, ReachMaxShare, random),
    tone,
    fade: fixedBetween(FadeMin, FadeMax, random),
  };
}

/** One band of marks, rolled fresh. */
export function rollGlyphColumn(random: Random): Glyph[] {
  return Array.from({ length: SlotsPerBand }, (_, slot) => rollGlyph(slot, random));
}
