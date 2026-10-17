/** Reading a host's paste as a theme list, and repairing a paste that is nearly one. The themes
 * themselves live in `./CustomThemes`; this file is only about the text a host brings with
 * them. */
import { CharacterColor, isCharacterColor } from './Characters';
import type { CustomTheme } from './CustomThemes';
import { findJsonSyntaxProblem, type JsonSyntaxProblem } from './JsonSyntax';
import { stripTrailingCommas, unwrapJsonFence } from './JsonPaste';

/** A type guard for a custom theme arriving from the network or a paste: a name to key it by, a
 * tint the room can wash it in, and at least one question, since without questions there is no
 * theme. */
export function isCustomTheme(value: unknown): value is CustomTheme {
  if (typeof value !== 'object' || value === null) return false;
  const record: Record<string, unknown> = { ...value };
  return (
    typeof record.name === 'string' &&
    record.name.length > 0 &&
    isCharacterColor(record.color) &&
    Array.isArray(record.questions) &&
    record.questions.every((q): q is string => typeof q === 'string') &&
    record.questions.length > 0
  );
}

/** Parse custom themes from pasted JSON: a single theme object or an array of them, or undefined
 * where it is not a theme list — which includes a paste carrying one name twice, since two
 * themes under one name is one theme with the other's questions. */
export function parseCustomThemesJson(json: string): CustomTheme[] | undefined {
  let read: unknown;
  try {
    read = JSON.parse(unwrapJsonFence(json));
  } catch {
    return undefined;
  }
  const entries: unknown[] = Array.isArray(read) ? read : [read];
  const themes: CustomTheme[] = [];
  // Names already met inside this paste. Not the browser's saved themes: a name already saved
  // is a theme being replaced, which is what the edit window does every time it saves. Only two
  // themes in one paste sharing a name is refused — those land on each other.
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!isCustomTheme(entry)) return undefined;
    if (seen.has(entry.name)) return undefined;
    seen.add(entry.name);
    themes.push({ name: entry.name, color: entry.color, questions: entry.questions });
  }
  return themes;
}

/** Why a paste is not a theme list: a syntax error says where the JSON stops making sense, a
 * parser error is one this scan does not look for and hands the parser's own words over, and a
 * shape error is the requirement stated, worded by the popup. */
export type CustomThemesError =
  | { kind: 'syntax'; problem: JsonSyntaxProblem }
  | { kind: 'parser'; message: string }
  | { kind: 'shape' };

/** What is wrong with pasted JSON, or undefined where it is a valid theme list. The scan runs
 * first so the host is told what is wrong with the paste in words they can act on, and the
 * parser runs second so nothing the scan looked over can slip through as a theme. */
export function customThemesJsonError(json: string): CustomThemesError | undefined {
  const text = unwrapJsonFence(json);
  const found = findJsonSyntaxProblem(text);
  if (found !== undefined) return { kind: 'syntax', problem: found };
  try {
    JSON.parse(text);
  } catch (error) {
    // The scan passed and the parser did not: a fault it does not look for, such as a bare word
    // where a value belongs. The parser's own message is then the best thing there is, and it is
    // better than a reason invented for a fault we did not find.
    return {
      kind: 'parser',
      message: error instanceof Error ? error.message : String(error),
    };
  }
  return parseCustomThemesJson(json) === undefined ? { kind: 'shape' } : undefined;
}

/** One entry of a paste read as far as it will go: its questions are load bearing, while the
 * name and the tint are filled in from what the host named it after when the paste carries
 * neither. */
const repairedTheme = (
  entry: unknown,
  index: number,
  defaultName: string
): CustomTheme | undefined => {
  if (typeof entry !== 'object' || entry === null) return undefined;
  const record: Record<string, unknown> = { ...entry };
  const questions = Array.isArray(record.questions)
    ? record.questions.filter((q): q is string => typeof q === 'string' && q.length > 0)
    : [];
  if (questions.length === 0) return undefined;
  const name =
    typeof record.name === 'string' && record.name.length > 0
      ? record.name
      : `${defaultName} ${index + 1}`;
  const color: CharacterColor = isCharacterColor(record.color) ? record.color : 'Yellow';
  return { name, color, questions };
};

/** Repair a paste that is nearly a theme list but not one yet, and hand it back pretty printed.
 * A host copying a theme out of somewhere gets whatever shape it was stored in: one line, no
 * name, no tint. Only the questions are load bearing: without them there is no theme. */
export function normalizeCustomThemesJson(
  json: string,
  defaultName: string
): string | undefined {
  let read: unknown;
  try {
    read = JSON.parse(stripTrailingCommas(unwrapJsonFence(json)));
  } catch {
    return undefined;
  }
  const entries: unknown[] = Array.isArray(read) ? read : [read];
  const themes: CustomTheme[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    const theme = repairedTheme(entry, index, defaultName);
    if (theme === undefined) return undefined;
    // Two themes repaired into one name is still two themes under one name, and the paste is not
    // what the host wrote, so it is refused rather than guessed at.
    if (seen.has(theme.name)) return undefined;
    seen.add(theme.name);
    themes.push(theme);
  }
  if (themes.length === 0) return undefined;
  return JSON.stringify(themes, null, 2);
}
