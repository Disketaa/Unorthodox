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

/** How many keys the longest row of a layout holds, which is how many the keyboard's width is
 * divided by. Taken from the layout: the two letter sets are not the same size, and one count
 * for both would leave the narrower one with unused width at the row's edge. */
export function columnsOf(rows: readonly (readonly string[])[]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.length), 0);
}
