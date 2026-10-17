import { describe, it, expect } from 'vitest';
import {
  isCustomTheme,
  normalizeCustomThemesJson,
  parseCustomThemesJson,
  customThemesJsonError,
} from './CustomThemeJson';
import { hasJsonFence } from './JsonPaste';

describe('a pasted theme list', () => {
  it('reads a theme with a name, a tint and questions', () => {
    const parsed = parseCustomThemesJson(
      '{"name":"Средневековье","color":"Amber","questions":["Метод казни"]}'
    );
    expect(parsed).toEqual([
      { name: 'Средневековье', color: 'Amber', questions: ['Метод казни'] },
    ]);
  });

  it('refuses a name twice, since the second would land on the first', () => {
    expect(
      parseCustomThemesJson(
        '[{"name":"A","color":"Amber","questions":["x"]},{"name":"A","color":"Lime","questions":["y"]}]'
      )
    ).toBeUndefined();
  });

  it('drops an id left over from a build that still numbered themes', () => {
    const parsed = parseCustomThemesJson(
      '{"id":7,"name":"Средневековье","color":"Amber","questions":["Метод казни"]}'
    );
    expect(parsed?.[0]).not.toHaveProperty('id');
  });

  it('takes the fence off a paste copied out of a readme', () => {
    const fenced = '```json\n{"name":"A","color":"Amber","questions":["x"]}\n```';
    expect(hasJsonFence(fenced)).toBe(true);
    expect(parseCustomThemesJson(fenced)?.[0]?.name).toBe('A');
  });

  it('repairs the comma a paste leaves in front of a closing bracket', () => {
    const repaired = normalizeCustomThemesJson(
      '{\n"name": "Средневековье",\n"color": "Amber",\n"questions": [\n"Метод казни",\n]\n}',
      'Польз.'
    );
    expect(repaired).not.toBeUndefined();
    expect(parseCustomThemesJson(repaired ?? '')?.[0]?.questions).toEqual(['Метод казни']);
  });

  it('leaves a comma that is part of a question alone', () => {
    const repaired = normalizeCustomThemesJson(
      '{"name":"A","color":"Amber","questions":["Что это, если не он",],}',
      'Польз.'
    );
    expect(parseCustomThemesJson(repaired ?? '')?.[0]?.questions).toEqual([
      'Что это, если не он',
    ]);
  });

  it('fills in a missing name and tint rather than refusing the questions', () => {
    const repaired = normalizeCustomThemesJson('{"questions":["Метод казни"]}', 'Польз.');
    expect(parseCustomThemesJson(repaired ?? '')).toEqual([
      { name: 'Польз. 1', color: 'Yellow', questions: ['Метод казни'] },
    ]);
  });

  it('gives up on a paste with no questions in it, rather than inventing some', () => {
    expect(
      normalizeCustomThemesJson('{"name":"A","color":"Amber","questions":[]}', 'Польз.')
    ).toBeUndefined();
  });

  it('says a broken paste is broken where it breaks, and in words that name the fault', () => {
    const problem = customThemesJsonError('{"name": "A",}');
    expect(problem?.kind).toBe('syntax');
    if (problem?.kind !== 'syntax') return;
    expect(problem.problem.reason).toBe('TrailingComma');
    expect(problem.problem.line).toBe(1);
  });

  it('points at the line a paste stops making sense on, not at the end of it', () => {
    const truncated = '{\n  "name": "Средневековье",\n  "color": "Amber",\n  "questions": [';
    const problem = customThemesJsonError(truncated);
    expect(problem?.kind).toBe('syntax');
    if (problem?.kind !== 'syntax') return;
    expect(problem.problem.reason).toBe('UnclosedBracket');
    // At the bracket left hanging, not at the end of the paste: the bracket is what has to be
    // closed, so that is the line to look at.
    expect(problem.problem.line).toBe(4);
  });

  it('says a string left open is a string left open', () => {
    const problem = customThemesJsonError('{\n  "name": "Средневековье\n}');
    expect(problem?.kind === 'syntax' && problem.problem.reason).toBe('UnclosedString');
  });

  it('says a paste that parses but is not a theme is the wrong shape', () => {
    expect(customThemesJsonError('{"name":"A"}')?.kind).toBe('shape');
  });

  it('calls nothing a theme that has not a name, a tint and questions', () => {
    expect(isCustomTheme({ name: 'A', color: 'Amber', questions: [] })).toBe(false);
    expect(isCustomTheme({ color: 'Amber', questions: ['x'] })).toBe(false);
    expect(isCustomTheme({ name: 'A', color: 'Chartreuse', questions: ['x'] })).toBe(false);
  });
});
