import { useState } from 'preact/hooks';
import { GlyphColumn } from './GlyphColumn';
import { rollGlyphColumn } from './RollGlyph';
import { useGlyphParallax } from './UseGlyphParallax';
import styles from './GlyphField.module.css';

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
  const [left] = useState(rollGlyphColumn);
  const [right] = useState(rollGlyphColumn);

  return (
    <div ref={parallax} class={styles.Root} aria-hidden="true">
      <GlyphColumn glyphs={left} side="Left" />
      <GlyphColumn glyphs={right} side="Right" />
    </div>
  );
}