/** A letter that reads the same in both of the room's layouts, so a ban on one is a ban on the
 * other. A player who thinks in one set and a player who thinks in the other are held to the
 * same answer, which is only true while the letters they cannot use are the same letters. */
export interface LetterPair {
  /** The Cyrillic spelling, as the Russian layout draws it. */
  ru: string;
  /** The Latin spelling, as the English layout draws it. */
  en: string;
}

/** Every letter that reads the same in both layouts, upper case. Twelve, because that is how
 * many of the two alphabets are the same shape; the rest are mirrored, tailed or their own
 * letter, and banning one would hold a Russian player to a letter an English player still has. */
export const LetterPairs: readonly LetterPair[] = [
  { ru: 'А', en: 'A' },
  { ru: 'В', en: 'B' },
  { ru: 'Е', en: 'E' },
  { ru: 'К', en: 'K' },
  { ru: 'М', en: 'M' },
  { ru: 'Н', en: 'H' },
  { ru: 'О', en: 'O' },
  { ru: 'Р', en: 'P' },
  { ru: 'С', en: 'C' },
  { ru: 'Т', en: 'T' },
  { ru: 'У', en: 'Y' },
  { ru: 'Х', en: 'X' },
];

/** Which end of a length an enchantment holds an answer to: the least it may be, or the most, or
 * absent where the round asks nothing about how long it is. */
export type LetterBound = { figure: number; least: boolean } | undefined;

/** Whether a draft sits inside the length an enchantment holds it to. Counting letters rather
 * than characters, since the two layouts' spellings of a pair are one letter each and a player
 * answering in English is not answering with two extra letters for it. */
export function draftFits(value: string, bound: LetterBound): boolean {
  if (bound === undefined) return true;
  return bound.least ? value.length >= bound.figure : value.length <= bound.figure;
}

/** Whether a draft carries at least one of the letters an enchantment demands: the round names
 * four and the writer picks which one to use, since a word cannot be four letters and a joke at
 * once. Asked of the draft rather than of the keys, so a typed letter is held to one rule. */
export function draftCarries(value: string, required: ReadonlySet<string>): boolean {
  if (required.size === 0) return true;
  return [...required].some((letter) => value.toUpperCase().includes(letter));
}

/** Every spelling of the given pairs, as the set a keyboard checks a key against. Both layouts
 * are in it, so a key asks one question whichever set is up. */
export function lettersOf(pairs: readonly LetterPair[]): ReadonlySet<string> {
  const letters = new Set<string>();
  for (const pair of pairs) {
    letters.add(pair.ru);
    letters.add(pair.en);
  }
  return letters;
}
