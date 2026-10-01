import { describe, test, expect } from 'vitest';
import { normalizeForGrouping, groupAnswers } from './Grouping';

// Helper to sort groups for consistent comparison
function sortGroups(groups: { groupId: number; answers: string[] }[]) {
  return groups
    .map(g => ({ text: g.answers[0], count: g.answers.length }))
    .sort((a, b) => a.text.localeCompare(b.text));
}

describe('normalizeForGrouping', () => {
  test('basic normalization and stripping endings', () => {
    // We assume endings like 'а', 'я' are stripped.
    expect(normalizeForGrouping('Привет')).toBe('привет');
    expect(normalizeForGrouping('Привета')).toBe('привет'); // stripped 'а'
    expect(normalizeForGrouping('Приветы')).toBe('привет'); // stripped 'ы'
    expect(normalizeForGrouping('Приветом')).toBe('привет'); // stripped 'ом'
    expect(normalizeForGrouping('Привет amie')).toBe('привет amie'); // only Russian words stripped
    expect(normalizeForGrouping('  Привет, как дела!  ')).toBe('привет как дела'); // punctuation removed, spaces collapsed
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

  test('groups similar answers within Levenshtein distance 1 for length >=5', () => {
    // 'hello' and 'hallo' have distance 1 (e->a)
    const answers = ['hello', 'hallo', 'world'];
    const groups = groupAnswers(answers);
    // Expect one group for 'hello'/'hallo' and one for 'world'
    const sorted = sortGroups(groups);
    expect(sorted).toHaveLength(2);
    const multiGroup = sorted.find(g => g.count === 2);
    expect(multiGroup).toBeDefined();
    if (multiGroup) {
      expect(['hello', 'hallo']).toContain(multiGroup.text);
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
});