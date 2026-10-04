import { useEffect } from 'preact/hooks';
import { accentFor, type CharacterColor } from '@/Core';

/**
 * The custom property names, which are the contract between this module and
 * `Tokens.css`.
 *
 * They are named here rather than built from a prefix so that renaming one is a
 * change in two places that the editor can find, rather than a change to a
 * string nobody can grep. The stylesheet is the other half of this contract and
 * says so.
 */
const Properties = {
  tint: '--Accent-Tint',
  ink: '--Accent-Ink',
  wash: '--Accent-Wash',
} as const;

/**
 * Puts one tint's accent on the document, so every page in the app wears it.
 *
 * Written onto `documentElement` rather than onto a wrapper: the tokens are
 * read by the overlays and the paper texture as well as by the screens, and the
 * app's own root element is not an ancestor of everything that paints. `:root`
 * is where `Tokens.css` declares the fallbacks, so writing there overrides them
 * and any screen that is mounted at all gets the accent.
 *
 * The values come from `Core`, not from here. The component's whole job is the
 * write: it has no colour of its own, so the palette and the stylesheet cannot
 * disagree about what "the accent" is.
 */
export function AccentProvider({ color }: { color: CharacterColor }) {
  useEffect(() => {
    applyAccent(document.documentElement, color);
  }, [color]);

  return null;
}

/**
 * The write itself, on whichever element it is handed.
 *
 * Separate from the component so a test can call it and read the result rather
 * than having to guess whether an effect has flushed, which is no way to find
 * out what was actually written.
 */
export function applyAccent(root: HTMLElement, color: CharacterColor): void {
  const accent = accentFor(color);
  root.style.setProperty(Properties.tint, accent.tint);
  root.style.setProperty(Properties.ink, accent.ink);
  root.style.setProperty(Properties.wash, accent.wash);
}