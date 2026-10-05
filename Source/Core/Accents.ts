import { CharacterColor, CharacterColors } from './Characters';

/** The three accent steps a tint actually needs. The raw character colour does two jobs it
 * cannot: read as text, and fill a cell. Deliberately no fill, hover or press step, since the
 * two filled buttons are fixed colours. */
export interface Accent {
  /** The character body's own colour. Headings take it even though five of the eight miss the
   * large-text bar; the test naming them records that rather than leaving it to be discovered. */
  tint: string;
  /** The hue dark enough to read as text or to draw a meaningful line. Separate because at the
   * raw tint the best of the eight manages 3.54 against white. */
  ink: string;
  /** A pale wash of the hue, for the inside of a chosen cell. Nothing is written on it, so it
   * carries no contrast requirement of its own. */
  wash: string;
}

export const Accents: Readonly<Record<CharacterColor, Accent>> = {
  Coral: { tint: '#ef6a5a', ink: '#ba5346', wash: '#fdf0ef' },
  Amber: { tint: '#f2a63b', ink: '#986925', wash: '#fef6eb' },
  Yellow: { tint: '#eeb62e', ink: '#8f6d1c', wash: '#fdf8ea' },
  Lime: { tint: '#7cb342', ink: '#577d2e', wash: '#f2f7ec' },
  Mint: { tint: '#26b58a', ink: '#1b8263', wash: '#e9f8f3' },
  Sky: { tint: '#3d9be9', ink: '#2f77b3', wash: '#ecf5fd' },
  Violet: { tint: '#8a7ae0', ink: '#7466bc', wash: '#f3f2fc' },
  Rose: { tint: '#e0559a', ink: '#be4883', wash: '#fceef5' },
};

/** The accent in force before a player has chosen, and if storage holds nothing. */
export const DefaultAccent: CharacterColor = 'Yellow';

export function accentFor(color: CharacterColor): Accent {
  return Accents[color];
}

/** Every accent, in catalogue order, for the contrast checks and the gallery. */
export function allAccents(): { color: CharacterColor; accent: Accent }[] {
  return CharacterColors.map((color) => ({ color, accent: Accents[color] }));
}
