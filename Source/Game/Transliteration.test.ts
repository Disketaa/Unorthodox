import { describe, test, expect } from 'vitest';
import { transliterateLatin } from './Transliteration';

describe('transliterateLatin', () => {
  test('folds a Latin keyboard to the Cyrillic it stands for', () => {
    expect(transliterateLatin('dota')).toBe('дота');
    // `u` reads as `у`; `ю` is the digraph `yu`, which is why "нюх" is typed `nyukh`.
    expect(transliterateLatin('nuх')).toBe('нух');
    expect(transliterateLatin('nyukh')).toBe('нюх');
  });

  test('reads a digraph ahead of the letters inside it', () => {
    // The alternation is ordered longest first, so `shch` is one letter and not `sh` plus `ch`.
    expect(transliterateLatin('shch')).toBe('щ');
    expect(transliterateLatin('sch')).toBe('щ');
    expect(transliterateLatin('shchi')).toBe('щи');
    expect(transliterateLatin('zh')).toBe('ж');
    expect(transliterateLatin('kh')).toBe('х');
    expect(transliterateLatin('ts')).toBe('ц');
    expect(transliterateLatin('yu')).toBe('ю');
    expect(transliterateLatin('ya')).toBe('я');
    expect(transliterateLatin('yo')).toBe('е');
  });

  test('leaves Cyrillic and digits alone, which is what makes it symmetric', () => {
    expect(transliterateLatin('нюх')).toBe('нюх');
    expect(transliterateLatin('дота 2')).toBe('дота 2');
    expect(transliterateLatin('')).toBe('');
  });
});
