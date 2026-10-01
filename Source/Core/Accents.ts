import { CharacterColor, CharacterColors } from './Characters';

/**
 * The accent each character tint wears when a player picks it.
 *
 * The tints themselves stay where they were, in `Tokens.css`, because they are
 * what the character art is filled with and the art reads a mid-tone. The accent is
 * the same hue at further steps, because an accent does two jobs a tint does not: it
 * carries text on top of it, and it stands as text or as a line on a light surface.
 * A mid-tone tint does neither comfortably, and `Accents.test.ts` measures it: at
 * the raw tint the best any of these manages against white is 3.54, so a title or a
 * selected cell in the tint itself would be unreadable. That is the whole reason
 * `ink` is a separate step rather than the tint reused.
 *
 * Four steps, and they are not interchangeable:
 *
 * - `base` fills a control and carries `on`, which is ink rather than white on every
 *   one of them.
 * - `hover` and `active` go *lighter*, not darker. Darkening a mid-tone lowers its
 *   contrast against dark ink, so the usual darker-on-hover ramp would drop the
 *   button's own label below the legibility floor at exactly the moment the pointer
 *   is on it. Going lighter can only raise that ratio.
 * - `ink` is the hue taken dark enough to read as text on the app's lightest
 *   surfaces, and it is what titles, scores, focus rings and selection borders are
 *   set in rather than `base`.
 * - `wash` is a pale tint of the hue, filling the inside of a chosen cell. It is
 *   decoration: nothing is written on it, so it carries no contrast requirement of
 *   its own beyond being visibly not the surface behind it.
 */
export interface Accent {
  /** The tint's own colour, which the character art already uses. */
  tint: string;
  /** Fills a control, and carries `on`. Never used as text or as a border. */
  base: string;
  hover: string;
  active: string;
  /** The hue taken dark enough to read as body text, or to draw a line. */
  ink: string;
  /**
   * The hue taken only as far as large text needs, which is a brighter step than
   * `ink` and much closer to the tint the character wears.
   */
  bright: string;
  /** A pale wash filling the inside of a chosen cell. Decoration only. */
  wash: string;
  /** The text that goes on `base`, `hover` and `active`. */
  on: string;
}

export const Accents: Readonly<Record<CharacterColor, Accent>> = {
  Coral: {
    tint: '#ef6a5a',
    base: '#ef6a5a',
    hover: '#f1796b',
    active: '#f2887b',
    ink: '#ba5346',
    bright: '#ea6858',
    wash: '#fdf0ef',
    on: '#212121',
  },
  Amber: {
    tint: '#f2a63b',
    base: '#f2a63b',
    hover: '#f3af4f',
    active: '#f5b862',
    ink: '#986925',
    bright: '#c2852f',
    wash: '#fef6eb',
    on: '#212121',
  },
  Yellow: {
    tint: '#eeb62e',
    base: '#eeb62e',
    hover: '#f0bd43',
    active: '#f1c558',
    ink: '#8f6d1c',
    bright: '#b58a23',
    wash: '#fdf8ea',
    on: '#212121',
  },
  Lime: {
    tint: '#7cb342',
    base: '#7cb342',
    hover: '#89bb55',
    active: '#96c268',
    ink: '#577d2e',
    bright: '#6e9f3b',
    wash: '#f2f7ec',
    on: '#212121',
  },
  Mint: {
    tint: '#26b58a',
    base: '#26b58a',
    hover: '#3cbc96',
    active: '#51c4a1',
    ink: '#1b8263',
    bright: '#22a37c',
    wash: '#e9f8f3',
    on: '#212121',
  },
  Sky: {
    tint: '#3d9be9',
    base: '#3d9be9',
    hover: '#50a5eb',
    active: '#64afed',
    ink: '#2f77b3',
    bright: '#3b96e2',
    wash: '#ecf5fd',
    on: '#212121',
  },
  Violet: {
    tint: '#8a7ae0',
    base: '#8a7ae0',
    hover: '#9687e3',
    active: '#a195e6',
    ink: '#7466bc',
    bright: '#8a7ae0',
    wash: '#f3f2fc',
    on: '#212121',
  },
  Rose: {
    tint: '#e0559a',
    base: '#e0559a',
    hover: '#e366a4',
    active: '#e677ae',
    ink: '#be4883',
    bright: '#e0559a',
    wash: '#fceef5',
    on: '#212121',
  },
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