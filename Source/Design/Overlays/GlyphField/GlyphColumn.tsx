import { Glyph, GlyphSide } from './RollGlyph';
import styles from './GlyphColumn.module.css';

/** Writes one mark's rolled values onto its node. Custom properties rather than a style prop, so
 * the component keeps a closed API and the stylesheet decides what each value means. Only
 * unitless numbers and percentages cross here. */
function applyGlyph(node: HTMLSpanElement, glyph: Glyph): void {
  const properties: [string, string][] = [
    ['--Glyph-Rotation', `${glyph.rotation.toFixed(2)}deg`],
    ['--Glyph-Depth', glyph.depth.toFixed(2)],
    ['--Glyph-Duration', `${glyph.durationS.toFixed(2)}s`],
    ['--Glyph-Delay', `${glyph.delayS.toFixed(2)}s`],
    ['--Glyph-Top', `${glyph.top.toFixed(2)}%`],
    ['--Glyph-Reach', glyph.reach.toFixed(2)],
    ['--Glyph-Scale', glyph.scale.toFixed(2)],
    ['--Glyph-Fade', glyph.fade.toFixed(2)],
  ];
  for (const [name, value] of properties) {
    node.style.setProperty(name, value);
  }
}

export interface GlyphColumnProps {
  glyphs: readonly Glyph[];
  /** Which screen edge this band hangs from. Decides where a mark is anchored. */
  side: GlyphSide;
}

/** One band of marks down a side of the screen. Two nested elements per mark: the outer carries
 * the parallax offset, the inner the drift. One element could not do both, a running animation
 * owning its transform. Decorative, so it lets pointer events through. */
export function GlyphColumn({ glyphs, side }: GlyphColumnProps) {
  return (
    <div class={`${styles.Root} ${styles[`Side${side}`]}`} aria-hidden="true">
      {glyphs.map((glyph, index) => (
        <span
          key={`${glyph.char}-${index}`}
          class={styles.Glyph}
          ref={(node) => {
            if (node !== null) {
              applyGlyph(node, glyph);
            }
          }}
        >
          <span class={`${styles.Mark} ${styles[`Tone${glyph.tone}`]}`}>{glyph.char}</span>
        </span>
      ))}
    </div>
  );
}