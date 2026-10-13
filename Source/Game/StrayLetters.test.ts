import { describe, test, expect } from 'vitest';
import { mergeStrayLetters } from './StrayLetters';

describe('mergeStrayLetters', () => {
  test('joins a word that was spelled out one letter at a time', () => {
    expect(mergeStrayLetters(['н', 'ю', 'х'])).toEqual(['нюх']);
    expect(mergeStrayLetters(['д', 'о', 'т', 'а'])).toEqual(['дота']);
  });

  test('glues a lone fragment to the word it was split from', () => {
    expect(mergeStrayLetters(['ню', 'х'])).toEqual(['нюх']);
    expect(mergeStrayLetters(['х', 'ню'])).toEqual(['хню']);
    expect(mergeStrayLetters(['ню', 'х', '2'])).toEqual(['нюх', '2']);
  });

  test('leaves a one-letter word a word, since it is one', () => {
    // "в лесу" is two answers' worth of typing and "влесу" is a different answer.
    expect(mergeStrayLetters(['в', 'лесу'])).toEqual(['в', 'лесу']);
    expect(mergeStrayLetters(['я', 'иду'])).toEqual(['я', 'иду']);
  });

  test('never merges two real words, however short the second is', () => {
    // Only fragments glue. "два" is three letters and so is a word, not a piece of "дота".
    expect(mergeStrayLetters(['дота', 'два'])).toEqual(['дота', 'два']);
  });

  test('leaves digits alone, since a number is not a fragment of a word', () => {
    expect(mergeStrayLetters(['2', '3'])).toEqual(['2', '3']);
    expect(mergeStrayLetters(['дота', '2'])).toEqual(['дота', '2']);
  });
});
