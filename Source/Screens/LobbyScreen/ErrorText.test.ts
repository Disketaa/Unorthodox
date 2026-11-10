import { describe, test, expect } from 'vitest';
import { errorText } from './ErrorText';
import { Strings } from '@/Content';
import type { JsonSyntaxProblem } from '@/Core';

describe('errorText', () => {
  test('returns undefined for undefined problem', () => {
    expect(errorText(undefined)).toBeUndefined();
  });

  test('returns shape error wording', () => {
    expect(errorText({ kind: 'shape' })).toBe(Strings.lobby.settings.customThemesInvalidTheme);
  });

  test('returns parser message', () => {
    expect(errorText({ kind: 'parser', message: 'bad json' })).toBe('bad json');
  });

  test('returns syntax problem wording', () => {
    const problem: { kind: 'syntax'; problem: JsonSyntaxProblem } = {
      kind: 'syntax',
      problem: { reason: 'UnexpectedChar', line: 3, column: 5 },
    };
    const expected = `${Strings.lobby.settings.customThemesJsonProblemAt(3, 5)}, ${Strings.lobby.settings.customThemesJsonProblems.UnexpectedChar}`;
    expect(errorText(problem)).toBe(expected);
  });
});
