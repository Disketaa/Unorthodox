/** Latin digraphs that stand for one Cyrillic letter, longest first so `shch` is read as `щ`
 * before `sh` can take the `sh` out of it. A Russian answer typed on a Latin keyboard is the same
 * answer, and this is what says so. */
export const latinDigraphs: Readonly<Record<string, string>> = {
  shch: 'щ',
  sch: 'щ',
  sh: 'ш',
  ch: 'ч',
  zh: 'ж',
  kh: 'х',
  ts: 'ц',
  yo: 'е',
  jo: 'е',
  ye: 'е',
  yu: 'ю',
  ju: 'ю',
  ya: 'я',
  ja: 'я',
};

/** Latin letters that stand for one Cyrillic letter each. Where a letter has two readings the
 * table picks the one a Russian keyboard's Latin layout puts in that place, and the edit distance
 * absorbs the rest: `c` reads as `с` here and as `ц` nowhere, which is a guess tuned from play
 * rather than a rule. */
export const latinLetters: Readonly<Record<string, string>> = {
  a: 'а',
  b: 'б',
  c: 'с',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'х',
  y: 'й',
  z: 'з',
};

/** Typical Russian endings to strip, in the order they must be tried: the first match wins, so a
 * two-letter plural ending is never shadowed by the single letter that starts it. */
export const russianEndings: readonly string[] = [
  'ам',
  'ям',
  'ом',
  'ем',
  'им',
  'ым',
  'а',
  'я',
  'ы',
  'ь',
  'й',
  'у',
  'ю',
  'е',
  'и',
];

/** One-letter words that are words in their own right, and so are never glued to a neighbour as
 * the fragment of a spaced-out word. Prepositions and particles, which is what a one-letter
 * Russian word is. */
export const oneLetterWords: ReadonlySet<string> = new Set([
  'в',
  'и',
  'к',
  'о',
  'с',
  'у',
  'я',
  'а',
  'б',
  'ж',
]);
