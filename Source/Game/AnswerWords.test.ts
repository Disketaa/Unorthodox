import { describe, test, expect } from 'vitest';
import { answerWords } from './AnswerWords';

describe('answerWords', () => {
  test('reads a spaced-out, doubled or elongated word as the word it is', () => {
    const expected = ['нюх'];
    expect(answerWords('нюх')).toEqual(expected);
    expect(answerWords('н ю х')).toEqual(expected);
    expect(answerWords('ню х')).toEqual(expected);
    expect(answerWords('ннюх')).toEqual(expected);
    expect(answerWords('нююх')).toEqual(expected);
    expect(answerWords('нюююююююююююююююююх')).toEqual(expected);
    expect(answerWords('нюююхххх')).toEqual(expected);
  });

  test('reads a Latin keyboard as the Cyrillic it stands for', () => {
    expect(answerWords('dota')).toEqual(['дота']);
    expect(answerWords('ДОТА')).toEqual(['дота']);
    expect(answerWords('дота!!!')).toEqual(['дота']);
  });

  test('keeps the words apart, so an extra word is an extra answer', () => {
    // One ending is stripped, not two: "черноплодная" keeps its adjectival form and is still a
    // second word beside "рябина", which is the whole of what makes them two answers.
    expect(answerWords('дота два')).toEqual(['дота', 'два']);
    expect(answerWords('черноплодная рябина')).toEqual(['черноплодна', 'рябин']);
    expect(answerWords('дота 2')).toEqual(['дота', '2']);
  });

  test('squeezes before it strips, so an ending under a run of letters still goes', () => {
    expect(answerWords('приветыыы')).toEqual(['привет']);
    expect(answerWords('приветы')).toEqual(['привет']);
  });

  test('reads an empty answer as no words at all', () => {
    expect(answerWords('')).toEqual([]);
    expect(answerWords('!!!')).toEqual([]);
    expect(answerWords('   ')).toEqual([]);
  });

  test('splits on punctuation rather than fusing across it', () => {
    expect(answerWords('а,б')).toEqual(['а', 'б']);
  });
});
