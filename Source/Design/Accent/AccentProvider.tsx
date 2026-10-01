import { useEffect } from 'preact/hooks';
import { accentFor, type CharacterColor } from '@/Core';
import { cursorTokens, hasFinePointer } from '../Cursors/Cursors';

/**
 * The custom property names, which are the contract between this module and
 * `Tokens.css`.
 *
 * They are named here rather than built from a prefix so that renaming one is a
 * change in two places that the editor can find, rather than a change to a string
 * nobody can grep. The stylesheet is the other half of this contract and says so.
 */
const Properties = {
  base: '--Accent-Base',
  hover: '--Accent-Hover',
  active: '--Accent-Active',
  ink: '--Accent-Ink',
  bright: '--Accent-Bright',
  wash: '--Accent-Wash',
  on: '--Accent-On',
  tint: '--Accent-Tint',
} as const;

/**
 * Puts one tint's accent on the document, so every page in the app wears it.
 *
 * Written onto `documentElement` rather than onto a wrapper: the tokens are read by
 * the overlays and the paper texture as well as by the screens, and the app's own
 * root element is not an ancestor of everything that paints. `:root` is where
 * `Tokens.css` declares the fallbacks, so writing there overrides them and any
 * screen that is mounted at all gets the accent.
 *
 * The values come from `Core`, not from here. The component's whole job is the
 * write: it has no colour of its own, so the palette and the stylesheet cannot
 * disagree about what "the accent" is.
 */
export function AccentProvider({ color }: { color: CharacterColor }) {
  useEffect(() => {
    const accent = accentFor(color);
    const root = document.documentElement;
    root.style.setProperty(Properties.base, accent.base);
    root.style.setProperty(Properties.hover, accent.hover);
    root.style.setProperty(Properties.active, accent.active);
    root.style.setProperty(Properties.ink, accent.ink);
    root.style.setProperty(Properties.bright, accent.bright);
    root.style.setProperty(Properties.wash, accent.wash);
    root.style.setProperty(Properties.on, accent.on);
    root.style.setProperty(Properties.tint, accent.tint);
    // The drawn cursors are tinted in the same hue, so the pointer belongs to the
    // player as well as the buttons do. Skipped on a device with no fine pointer,
    // where the stylesheet's own keywords are already the whole answer.
    if (hasFinePointer()) {
      for (const [name, value] of cursorTokens(accent.base)) {
        root.style.setProperty(name, value);
      }
    }
  }, [color]);

  return null;
}