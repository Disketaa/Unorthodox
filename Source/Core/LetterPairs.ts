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
