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

/** One seed decides the whole field, both bands. The bands are mirror images rather than two of anything, so one arrangement describes both. */
function rollField(): Field {
  const seed = Seeds[Math.floor(Math.random() * Seeds.length)] ?? Seeds[0];
  const random = createRandom(seed);
  return { left: rollGlyphColumn(random), right: rollGlyphColumn(random) };
}

/**
 * Oversized marks down the left and right margins, leaving the middle clear for the game.
 *
 * The clearance is not a guess: each band is exactly the space the content column does not use,
 * so the marks cannot reach the text however narrow the screen gets.
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