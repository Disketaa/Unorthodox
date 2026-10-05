import { useEffect } from 'preact/hooks';
import { accentFor, type CharacterColor } from '@/Core';

/** The custom property names, which are the contract between this module and `Tokens.css`. Named
 * here rather than built from a prefix, so renaming one is a change in two places the editor
 * can find rather than to a string nobody can grep. */
const Properties = {
  tint: '--Accent-Tint',
  ink: '--Accent-Ink',
  wash: '--Accent-Wash',
} as const;

/** Puts one tint's accent on the document, so every page in the app wears it. Written onto
 * `documentElement`, not a wrapper: the overlays and paper texture read the tokens too, and the
 * app root is not an ancestor of everything that paints. Values come from `Core`. */
export function AccentProvider({ color }: { color: CharacterColor }) {
  useEffect(() => {
    applyAccent(document.documentElement, color);
  }, [color]);

  return null;
}

/** The write itself, on whichever element it is handed. Separate from the component so a test
 * can call it and read the result rather than having to guess whether an effect has flushed,
 * which is no way to find out what was actually written. */
export function applyAccent(root: HTMLElement, color: CharacterColor): void {
  const accent = accentFor(color);
  root.style.setProperty(Properties.tint, accent.tint);
  root.style.setProperty(Properties.ink, accent.ink);
  root.style.setProperty(Properties.wash, accent.wash);
}
