import { Glyph, GlyphSide } from './RollGlyph';
import styles from './GlyphColumn.module.css';

/**
 * How long after the previous one each mark starts appearing.
 *
 * Small, so a band of them arrives as one movement rather than as a list being
 * read out. The whole field is visible well under a second after load, which is
 * what makes it feel like a page settling rather than an animation being played.
 */
const AppearStaggerMs = 22;

/**
 * Writes one mark's rolled values onto its node.
 *
 * Custom properties rather than a style prop, the way the paper overlay sets its
 * own drift: the component keeps a closed API and the stylesheet still decides
 * what each value means. Only unitless numbers and percentages cross this
 * boundary; every length, including a mark's size, comes from `Tokens.css`.
 */
function applyGlyph(node: HTMLSpanElement, glyph: Glyph, index: number): void {
  const properties: [string, string][] = [
    ['--Glyph-Rotation', `${glyph.rotation.toFixed(2)}deg`],
    ['--Glyph-AppearDelay', `${(index * AppearStaggerMs).toFixed(0)}ms`],
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

/**
 * One band of marks down a side of the screen.
 *
 * Two nested elements per mark: the outer one carries the parallax offset, the
 * inner one carries the drift animation. A single element could not do both,
 * because a running animation owns its transform and would drop the parallax.
 *
 * Decorative only, so the column is hidden from assistive technology and lets
 * pointer events through, which keeps the interface underneath usable.
 */
export function GlyphColumn({ glyphs, side }: GlyphColumnProps) {
  return (
    <div class={`${styles.Root} ${styles[`Side${side}`]}`} aria-hidden="true">
      {glyphs.map((glyph, index) => (
        <span
          key={`${glyph.char}-${index}`}
          class={styles.Glyph}
          ref={(node) => {
            if (node !== null) {
              applyGlyph(node, glyph, index);
            }
          }}
        >
          <span class={`${styles.Mark} ${styles[`Tone${glyph.tone}`]}`}>{glyph.char}</span>
        </span>
      ))}
    </div>
  );
}