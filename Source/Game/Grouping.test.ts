import { describe, test, expect } from 'vitest';
import { normalizeForGrouping, sameAnswer, groupAnswers } from './Grouping';

function sortGroups(groups: { groupId: number; answers: string[] }[]) {
  return groups
    .map((g) => ({ text: g.answers[0], count: g.answers.length }))
    .sort((a, b) => a.text.localeCompare(b.text));
}

describe('normalizeForGrouping', () => {
  test('basic normalization and stripping endings', () => {
    // We assume endings like 'а', 'я' are stripped.
    expect(normalizeForGrouping('Привет')).toBe('привет');
    expect(normalizeForGrouping('Привета')).toBe('привет');
    expect(normalizeForGrouping('Приветы')).toBe('привет');
    expect(normalizeForGrouping('Приветом')).toBe('привет');
    // Latin text is left alone; punctuation and repeated spaces are removed.
    expect(normalizeForGrouping('Привет amie')).toBe('привет amie');
    expect(normalizeForGrouping('  Привет, как дела!  ')).toBe('привет как дела');
  });
});

describe('sameAnswer', () => {
  test('reads a sloppy word as the word it is', () => {
    // Stray spaces, a doubled letter, an inserted letter, a held key: all one answer.
    expect(sameAnswer('нюх', 'н ю х')).toBe(true);
    expect(sameAnswer('нюх', 'ню х')).toBe(true);
    expect(sameAnswer('нюх', 'ннюх')).toBe(true);
    expect(sameAnswer('нюх', 'нююх')).toBe(true);
    expect(sameAnswer('нюх', 'нюююююююююююююююююх')).toBe(true);
    expect(sameAnswer('нюх', 'нюююхххх')).toBe(true);
  });

  test('reads a Latin keyboard as the same answer', () => {
    expect(sameAnswer('дота', 'dota')).toBe(true);
    expect(sameAnswer('нюх', 'nyukh')).toBe(true);
  });

  test('never reads an extra word as the same answer', () => {
    // The count of words is part of the answer, so a qualifier is a different answer however
    // much of it is shared.
    expect(sameAnswer('дота два', 'дота')).toBe(false);
    expect(sameAnswer('рябина', 'черноплодная рябина')).toBe(false);
    expect(sameAnswer('красный дом', 'дом красный')).toBe(false);
  });

  test('keeps a numbered answer distinct from its neighbour', () => {
    expect(sameAnswer('дота 2', 'дота 3')).toBe(false);
    expect(sameAnswer('дота 2', 'дота')).toBe(false);
  });

  test('agrees with itself whichever way round it is asked', () => {
    const answers = ['нюх', 'н ю х', 'дота', 'dota', 'дота два', 'рябина', 'приветы'];
    for (const a of answers) {
      for (const b of answers) {
        expect(sameAnswer(a, b)).toBe(sameAnswer(b, a));
      }
    }
  });

  test('agrees with the grouping it drives', () => {
    // The host groups and a browser asks about its own card, so the two have to be one rule.
    const answers = ['нюх', 'ннюх', 'дота', 'dota', 'дота два', 'рябина'];
    for (const a of answers) {
      for (const b of answers) {
        const grouped = groupAnswers([a, b]);
        expect(grouped).toHaveLength(sameAnswer(a, b) ? 1 : 2);
      }
    }
  });
});

describe('groupAnswers', () => {
  test('groups exact matches', () => {
    const answers = ['hello', 'hello', 'world'];
    const groups = groupAnswers(answers);
    expect(groups).toHaveLength(2);
    // We expect two groups: one for 'hello' with 2 answers, one for 'world' with 1 answer.
    // Since the order might vary, we'll check by sorting.
    const sorted = sortGroups(groups);
    expect(sorted).toEqual([
      { text: 'hello', count: 2 },
      { text: 'world', count: 1 },
    ]);
  });

  test('groups a sloppy spelling of the same answer', () => {
    // A Latin answer is folded to Cyrillic and then squeezed, so "hello" and "hallo" both come out
    // four letters long and fall under the fuzzy floor: they are two answers now, where they were
    // one when the whole string was compared. The rule that replaces it is the Russian one above.
    const groups = groupAnswers(['телефон', 'телефен', 'мир']);
    const sorted = sortGroups(groups);
    expect(sorted).toHaveLength(2);
    const multiGroup = sorted.find((g) => g.count === 2);
    expect(multiGroup).toBeDefined();
    if (multiGroup) {
      expect(['телефон', 'телефен']).toContain(multiGroup.text);
    }
  });

  test('does not group short strings with distance 1 unless exact match', () => {
    // 'hi' and 'hi' -> exact match, group.
    // 'hi' and 'ha' -> distance 1 but length <5, should not group.
    const answers = ['hi', 'hi', 'ha'];
    const groups = groupAnswers(answers);
    // Expect two groups: one for 'hi' (count 2), one for 'ha' (count 1)
    const sorted = sortGroups(groups);
    expect(sorted).toEqual([
      { text: 'ha', count: 1 },
      { text: 'hi', count: 2 },
    ]);
  });

  test('handles empty input', () => {
    expect(groupAnswers([])).toHaveLength(0);
  });

  test('numbers its groups from zero in the order they first appear', () => {
    const groups = groupAnswers(['дота', 'нюх', 'dota']);
    expect(groups.map((group) => group.groupId)).toEqual([0, 1]);
    expect(groups[0].answers).toEqual(['дота', 'dota']);
    expect(groups[1].answers).toEqual(['нюх']);
  });

  test('keys a group on its first member, since fuzzy matching is not transitive', () => {
    // The first matches the second and the second matches the third, but the first does not match
    // the third. A group is whatever its first answer is, so the third is left on its own rather
    // than dragged in by the middle — and a browser asking about its own card asks about the first.
    const groups = groupAnswers(['гршдт', 'грчдт', 'грчет']);
    expect(groups).toHaveLength(2);
    expect(groups[0].answers).toEqual(['гршдт', 'грчдт']);
    expect(groups[1].answers).toEqual(['грчет']);
  });
});
