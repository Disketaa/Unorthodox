import { useState } from 'preact/hooks';
import { createRandom } from '@/Core';
import { GlyphColumn } from './GlyphColumn';
import { rollGlyphColumn, type Glyph } from './RollGlyph';
import { Seeds } from './GlyphSeeds';
import { useGlyphParallax } from './UseGlyphParallax';
import styles from './GlyphField.module.css';

interface Field {
  left: Glyph[];
  right: Glyph[];
}

/**
 * One seed decides the whole field, both bands.
 *
 * Two seeds would let each side be arranged independently, and the bands are
 * mirror images of each other rather than two of anything, so one arrangement
 * describes both. They still hold different marks, because the second is rolled
 * from where the first stopped rather than from the start of the sequence.
 */
function rollField(): Field {
  const seed = Seeds[Math.floor(Math.random() * Seeds.length)] ?? Seeds[0];
  const random = createRandom(seed);
  return { left: rollGlyphColumn(random), right: rollGlyphColumn(random) };
}

/**
 * Oversized marks down the left and right margins, leaving the middle clear for
 * the game itself.
 *
 * The clearance is not a guess: each band is exactly the space the content
 * column does not use, taken from the same layout tokens that centre the
 * content. So the marks cannot reach the text however narrow the screen gets,
 * and they grow into whatever space a wide screen leaves over.
 *
 * Rolled once and held in state, so a re-render anywhere in the app does not
 * reshuffle the field under the player.
 *
 * Decorative only: hidden from assistive technology and inert to the pointer,
 * so it never covers or intercepts anything.
 */
export function GlyphField() {
  const parallax = useGlyphParallax();
  const [{ left, right }] = useState(rollField);

  return (
    <div ref={parallax} class={styles.Root} aria-hidden="true">
      <GlyphColumn glyphs={left} side="Left" />
      <GlyphColumn glyphs={right} side="Right" />
    </div>
  );
}