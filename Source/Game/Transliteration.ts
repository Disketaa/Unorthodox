import { latinDigraphs, latinLetters } from './GroupingTables';

/** Every Latin reading there is, longest first, built once at module load. The order is the
 * whole of the rule: an alternation takes its first match, so a digraph listed ahead of the
 * letters inside it is the one that wins. */
const latinPattern = new RegExp(
  [...Object.keys(latinDigraphs), ...Object.keys(latinLetters)]
    .sort((a, b) => b.length - a.length)
    .join('|'),
  'g'
);

/** Fold Latin letters to the Cyrillic they stand for, so an answer typed on a Latin keyboard
 * reads as the answer it is. Cyrillic and digits pass through untouched, which is what makes
 * the fold symmetric: both sides of a comparison run it, so neither ends up in an alien script. */
export function transliterateLatin(text: string): string {
  return text.replace(
    latinPattern,
    (match) => latinDigraphs[match] ?? latinLetters[match] ?? match
  );
}
