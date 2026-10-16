import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { ThemeBanks, ThemeColors, ThemeIds } from '../Source/Core';

/** The theme files as they sit on disk, read the way the build reads them. Out here for the
 * reason the other tests in this folder are: `Source` may not reach `node:fs`, and the point of
 * these is the files themselves rather than the code that loads them. */
const folder = new URL('../Source/Content/Themes/', import.meta.url);

interface Written {
  color: unknown;
  questions: unknown[];
}

/** One file's own words, or undefined where it will not read as a theme file at all. */
function written(name: string): Written | undefined {
  const raw: unknown = JSON.parse(readFileSync(new URL(`${name}.json`, folder), 'utf8'));
  if (raw === null || typeof raw !== 'object') return undefined;
  const { color, questions } = raw as Written;
  return Array.isArray(questions) ? { color, questions } : undefined;
}

/** What a loader owes a file: the questions as written, trimmed, with the repeats taken off —
 * two questions written the same are one, or a room would be asked it twice. */
function expected(name: string): string[] {
  const file = written(name);
  if (file === undefined) return [];
  return [...new Set(file.questions.map((q) => String(q).trim()))].filter(Boolean);
}

describe('the theme files on disk', () => {
  it('are one file per theme in the registry, and no others', () => {
    const onDisk = readdirSync(folder)
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -'.json'.length))
      .sort();
    expect(onDisk).toEqual([...ThemeIds].sort());
  });

  it('each name the tint they wash in, which is the palette key and not a word', () => {
    for (const theme of ThemeIds) {
      expect(written(theme)?.color, theme).toBe(ThemeColors.get(theme));
    }
  });

  it('reach the bank exactly as written, so a theme file is the whole of its theme', () => {
    // What is written in the folder is what a room is asked. The wording is the author's to
    // change whenever they like; this only says the file is what the game reads.
    for (const theme of ThemeIds) {
      expect(ThemeBanks.get(theme), theme).toEqual(expected(theme));
    }
  });

  it('hold enough questions for a full run of the theme, since a round has to be playable', () => {
    for (const theme of ThemeIds) {
      expect(ThemeBanks.get(theme)?.length ?? 0, theme).toBeGreaterThan(0);
    }
  });
});
