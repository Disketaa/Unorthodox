/** The two letter sets an answer can be typed in, both QWERTY rather than equal rows so a hand
 * knows where the keys are. The fourth row is empty in both: it carries the language, the space
 * bar and enter, none of which are letters. */
export const Layouts = {
  ru: [
    ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
    ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
    ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
    [],
  ],
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    [],
  ],
} as const satisfies Record<string, readonly (readonly string[])[]>;

/** Which letter set is on the keys. An answer may be typed in either, since the room does not
 * insist on a language and a player who thinks faster in one should not have to stop to
 * translate before answering. */
export type KeyboardLang = keyof typeof Layouts;

/** The other language, which is only ever the other one. */
export function otherLang(lang: KeyboardLang): KeyboardLang {
  return lang === 'ru' ? 'en' : 'ru';
}

/** Where a key sits, as a name that is the same in both layouts: its row and its place in it. A
 * press is counted against this rather than the letter, which changes when the layout does, so
 * a count that followed it would replay every key's last pop on the way back. */
export type KeySlot = string;

/** The slot a letter sits in, or undefined for a key that is not on the board. */
export function slotOf(
  rows: readonly (readonly string[])[],
  letter: string
): KeySlot | undefined {
  for (const [rowIndex, row] of rows.entries()) {
    const column = row.indexOf(letter);
    if (column >= 0) return `${rowIndex}.${column}`;
  }
  return undefined;
}

/** The slots the four keys that are not letters hold, so a caller counts a press against the
 * same name the row renders it under. */
export const Slots = {
  Backspace: 'b.2',
  Lang: 'l.3',
  Space: 's.3',
  Enter: 'e.3',
} as const;

/** How many keys the longest row holds, which is how many the keyboard's width is divided by.
 * Taken from the layout: the two letter sets are not the same size, and one count for both
 * would leave the narrower one with unused width at the row's edge. */
export function columnsOf(rows: readonly (readonly string[])[]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.length), 0);
}
