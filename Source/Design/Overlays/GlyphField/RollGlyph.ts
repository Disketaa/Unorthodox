import type { Random } from '@/Core';

/**
 * The pool of marks used to fill the margins.
 *
 * Symbols only: letters at this size stop reading as texture and start reading as words, and
 * the centre column has to be free of words. Every one is in BlobSpongey.
 */
const Symbols = ['@', '#', '$', '%', '&', '*', '+', '=', '?', '!', '~', ';', ':', '/', '\\', '^'];

/**
 * How many marks along one band, and so how finely the height is divided.
 *
 * Doubled from twenty-two: a mark is much wider than it is tall, so the band read as a few
 * large shapes with gaps. More marks is the fix rather than smaller ones — a smaller mark on a
 * phone is barely larger than the body text behind it.
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
 * Weighted low, because the small end is what the corners and the gaps need, and a band of
 * large marks alone reads as a solid shape rather than as marks.
 */
const ScaleChoices = [0, 0, 0.25, 0.25, 0.5, 0.75, 1];

const RotationDeg = 24;
const DurationMinS = 16;
const DurationMaxS = 34;

/**
 * How far a mark may sit outside its slot, as a share of the step between two slots.
 *
 * A share of the step and not of the band, which keeps the arrangement the same shape at any
 * density: doubling the slots halves the step. A mark may cross into its neighbour's slot.
 */
const JitterShare = 0.35;

/**
 * How much paler than full a mark may be, as a share of the opacity token.
 *
 * The second, separate axis from tone, so a band has marks differing in weight as well as
 * value. Without it a band of one tone reads as a flat screen of the same mark rather than a
 * crowd.
 */
const FadeMin = 0.35;
const FadeMax = 0.85;

/**
 * How far past the screen edge a mark's centre may sit, as a share of its own width and scaled
 * by `--Glyph-EdgeReach`.
 *
 * A share of the mark's own width, so it sits the same way relative to itself on every screen.
 */
const ReachMinShare = 0.1;
const ReachMaxShare = 0.45;

/**
 * Which edge of the screen a band hangs from.
 *
 * The same marks serve both bands and only the anchor differs, which keeps the two sides one
 * arrangement rather than two independently rolled ones that happen to look alike.
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
 * Spread over the band rather than the viewport, so marks are dense everywhere the band is
 * tall. The slots run to the band's own ends because it is pulled past both screen edges, which
 * carries the field off the top and bottom rather than stopping at them.
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
 * The generator is passed in rather than reached for, the way a look is rolled in Core, so one
 * seed decides the whole field and the field can be rolled again from the seed reported for it.
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
