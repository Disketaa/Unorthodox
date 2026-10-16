/** Custom themes a host pastes into a room: a name, a tint, and questions. Kept beside the
 * authored ones so a custom theme can be dealt into a bank just like any other. */
import { ThemeBanks, ThemeColors, ThemeId } from './Themes';
import { CharacterColor, isCharacterColor } from './Characters';

export interface CustomTheme {
  /** The theme's own name, and what it is keyed by. A custom theme has no file to take an id
   * from and does not need one: the name is already there and already what the room shows. Two
   * themes may not share it — the second would replace the first rather than sit beside it. */
  name: string;
  color: CharacterColor;
  questions: readonly string[];
}

/** The key custom themes are saved under in this browser's cache. */
const CustomThemesStorageKey = 'unorthodox-custom-themes';

/** The custom themes this browser knows, keyed by name, loaded from its cache on first use. */
let customThemes: Map<string, CustomTheme> | undefined;

/** What custom themes this browser has saved, or none yet. Loaded once and kept in memory. */
export function loadCustomThemes(): Map<string, CustomTheme> {
  if (customThemes !== undefined) return customThemes;
  customThemes = new Map();
  try {
    const raw = localStorage.getItem(CustomThemesStorageKey);
    if (raw === null) return customThemes;
    const read: unknown = JSON.parse(raw);
    if (!Array.isArray(read)) return customThemes;
    for (const entry of read) {
      // An id is written into older saves and read back as a leftover field rather than a key:
      // the name is the key now, and a theme saved before this had a name to key it by.
      if (!isCustomTheme(entry)) continue;
      // Rebuilt rather than spread, so an `id` written by a build that still numbered themes is
      // dropped on the way in rather than carried along beside the name for the rest of the room.
      customThemes.set(entry.name, {
        name: entry.name,
        color: entry.color,
        questions: entry.questions,
      });
    }
  } catch {
    customThemes = new Map();
  }
  return customThemes;
}

/** Save the custom themes this browser knows to its cache. */
export function saveCustomThemes(themes: Map<string, CustomTheme>): void {
  try {
    localStorage.setItem(CustomThemesStorageKey, JSON.stringify([...themes.values()]));
  } catch {
    // A full cache is not worth crashing the room over.
  }
}

/** Add one custom theme to this browser's cache and to the live map, under its own name. */
export function addCustomTheme(theme: CustomTheme): void {
  const themes = loadCustomThemes();
  themes.set(theme.name, theme);
  saveCustomThemes(themes);
}

/** Remove one custom theme from this browser's cache and from the live map, by its name. */
export function removeCustomTheme(name: string): void {
  const themes = loadCustomThemes();
  themes.delete(name);
  saveCustomThemes(themes);
}

/** The questions a theme asks, whether from a file or a custom paste. The registry is read first
 * and a name it did not answer for is read from the custom themes, so the two can never both
 * answer to one name. */
export function themeQuestions(theme: ThemeId): readonly string[] | undefined {
  return ThemeBanks.get(theme) ?? customThemes?.get(theme)?.questions;
}

/** Every custom theme this browser has saved, in the order they were saved. Read from the cache
 * rather than the room's state, so a host's themes are still theirs after the browser is
 * closed: a theme is written down when it is pasted, and a room is not where it lives. */
export function savedCustomThemes(): CustomTheme[] {
  return [...loadCustomThemes().values()];
}

/** The tint a theme washes in, whether from a file or a custom paste. An authored theme keeps
 * its file's tint; a name that is not one of the registry's washes in the tint the host picked. */
export function themeColor(theme: ThemeId): CharacterColor | undefined {
  return ThemeColors.get(theme) ?? customThemes?.get(theme)?.color;
}

/** Whether a name is an authored theme's. A custom theme is deliberately not one of these: it is
 * known to the browser that saved it and to nobody else, so the registry stays the one list a
 * theme is an authored one by, and a custom name can never shadow a file. */
export function isKnownThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && ThemeBanks.has(value);
}

/** A type guard for a custom theme arriving from the network or a paste. */
export function isCustomTheme(value: unknown): value is CustomTheme {
  if (typeof value !== 'object' || value === null) return false;
  const record = { ...value };
  return isCustomThemeRecord(record);
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
  // name that is already saved is a theme being replaced — that is what the edit window does
  // every time it saves — and only two themes in the same paste sharing one name is refused,
  // since those would land on each other with nothing to say which won.
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!isCustomTheme(entry)) return undefined;
    if (seen.has(entry.name)) return undefined;
    seen.add(entry.name);
    themes.push({
      name: entry.name,
      color: entry.color,
      questions: entry.questions,
    });
  }
  return themes;
}

function isCustomThemeRecord(record: Record<string, unknown>): boolean {
  return (
    typeof record.name === 'string' &&
    record.name.length > 0 &&
    isCharacterColor(record.color) &&
    Array.isArray(record.questions) &&
    record.questions.every((q): q is string => typeof q === 'string') &&
    record.questions.length > 0
  );
}

/** Take the fence off a paste that carries one: JSON copied out of a chat or a readme brings the
 * backticks and the language tag with it, and neither is part of the theme. Only a fence with a
 * closing fence is taken, so text merely starting with backticks keeps what follows it. */
function unwrapJsonFence(json: string): string {
  const text = json.trim();
  const opening = /^```[a-zA-Z]*\r?\n/.exec(text);
  if (opening === null) return text;
  const rest = text.slice(opening[0].length);
  const closing = rest.lastIndexOf('```');
  if (closing === -1) return text;
  return rest.slice(0, closing).trim();
}

/** Take off the comma a paste leaves in front of a closing bracket. It is the one piece of
 * broken JSON that comes from copying rather than from typing: text copied out of a chat, a
 * document or a spreadsheet's list formatting habitually ends its last entry with a comma, and
 * JSON has no comma there. Reading is done by hand rather than by rewriting through a parse,
 * since the text being repaired is by definition the text the parser could not read; strings
 * are stepped over, so a comma inside a question's own wording is left alone. */
function stripTrailingCommas(text: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += text[i + 1] ?? '';
        i += 1;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === ',') {
      // Look ahead past whitespace for the bracket this comma is standing in front of.
      let ahead = i + 1;
      while (ahead < text.length && /\s/.test(text[ahead] ?? '')) ahead += 1;
      if (text[ahead] === '}' || text[ahead] === ']') continue;
    }
    out += ch;
  }
  return out;
}

/** Whether a paste carries a code fence, so the editor can put the unwrapped text in the box
 * rather than leaving the host to look at their own backticks. */
export function hasJsonFence(json: string): boolean {
  return unwrapJsonFence(json) !== json.trim();
}

/** Where a paste stops making sense, and why. Carried as a reason and a place rather than as a
 * sentence: the wording of it belongs to the interface, so no user-facing text lives in `Core`.
 * The reason is a named thing rather than a code so that the popup can say what happened in
 * words a host can act on, and the line and column are counted from one so they can be found in
 * the box above the message. */
export type JsonSyntaxProblem = {
  reason:
    | 'UnclosedString'
    | 'UnclosedBracket'
    | 'MismatchedBracket'
    | 'TrailingComma'
    | 'MissingValue'
    | 'UnexpectedChar'
    | 'UnexpectedEnd';
  line: number;
  column: number;
};

/** Why a paste is not a theme list: a syntax error says where the JSON stops making sense, a
 * parser error is one this scan does not look for and hands the parser's own words over, and a
 * shape error is the requirement stated, worded by the popup. */
export type CustomThemesError =
  | { kind: 'syntax'; problem: JsonSyntaxProblem }
  | { kind: 'parser'; message: string }
  | { kind: 'shape' };

/** Walk the JSON by hand and say where it first stops making sense. The parser itself would only
 * say so in the browser's own words — "Unexpected end of JSON input", or a position counted
 * from zero that means nothing to a host looking at their paste — so the structure is read here
 * instead and the first thing that cannot be is named. Deliberately not a parser: it looks only
 * for the faults a paste actually arrives with, and anything it passes over that `JSON.parse`
 * still refuses falls back to the parser's own message rather than being guessed at. Returns
 * undefined where the text holds together, which is the common case and costs one pass. */
function findJsonSyntaxProblem(text: string): JsonSyntaxProblem | undefined {
  // Where each bracket was opened, so a closing one can be matched against it and the line can be
  // pointed at the bracket left hanging rather than at the end of the paste.
  const open: { at: number; line: number; column: number; char: '{' | '[' }[] = [];
  let inString = false;
  let escaped = false;
  let stringStart: { line: number; column: number } = { line: 1, column: 1 };
  let afterValue = false;
  let expectValue = false;
  let line = 1;
  let column = 1;
  // The last comma seen and where it was, so a paste ending in one can be reported at the comma
  // rather than at the very end, which is where the parser puts it and which is the wrong place
  // for a host to look.
  let lastComma: { at: number; line: number; column: number } | undefined;

  // The place moves on as the text is walked, a newline being the only thing that starts a new
  // line. Counted from one, so that the line and column in a message are the ones a host sees in
  // their editor rather than the ones the parser counts from zero.
  const step = (ch: string): void => {
    if (ch === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? '';
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') {
        inString = false;
        afterValue = true;
      }
      step(ch);
      continue;
    }
    if (ch === '"') {
      if (afterValue) {
        return { reason: 'UnexpectedChar', line, column };
      }
      inString = true;
      stringStart = { line, column };
      afterValue = false;
      expectValue = false;
      step(ch);
      continue;
    }
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
      step(ch);
      continue;
    }
    if (ch === '{' || ch === '[') {
      if (afterValue) {
        return { reason: 'UnexpectedChar', line, column };
      }
      open.push({ at: i, line, column, char: ch });
      afterValue = false;
      expectValue = false;
      step(ch);
      continue;
    }
    if (ch === '}' || ch === ']') {
      // A bracket closing while a value is still wanted is a comma standing in front of it: the
      // one fault a paste arrives with most often, and the one the parser's own message is least
      // use for, since it names the bracket rather than the comma the host has to delete.
      if (expectValue && lastComma !== undefined) {
        return { reason: 'TrailingComma', ...lastComma };
      }
      const frame = open[open.length - 1];
      if (frame === undefined) {
        return { reason: 'MismatchedBracket', line, column };
      }
      const wanted: '{' | '[' = ch === '}' ? '{' : '[';
      if (frame.char !== wanted) {
        return { reason: 'MismatchedBracket', line, column };
      }
      open.pop();
      afterValue = true;
      expectValue = false;
      step(ch);
      continue;
    }
    if (ch === ',') {
      if (open.length === 0) {
        return { reason: 'UnexpectedChar', line, column };
      }
      lastComma = { at: i, line, column };
      afterValue = false;
      expectValue = true;
      step(ch);
      continue;
    }
    if (ch === ':') {
      if (open[open.length - 1]?.char !== '{') {
        return { reason: 'UnexpectedChar', line, column };
      }
      expectValue = true;
      afterValue = false;
      step(ch);
      continue;
    }
    // Anything left is the start of a bare value: a number, true, false or null. Only its start
    // matters here, since what follows it is `JSON.parse`'s business and not this scan's.
    if (afterValue) {
      return { reason: 'UnexpectedChar', line, column };
    }
    afterValue = true;
    expectValue = false;
    step(ch);
  }

  if (inString) return { reason: 'UnclosedString', ...stringStart };
  const leftOpen = open[open.length - 1];
  if (leftOpen !== undefined) return { reason: 'UnclosedBracket', ...leftOpen };
  if (expectValue && lastComma !== undefined) {
    // A comma with nothing after it is a comma a paste left behind; a colon with nothing after it
    // is a value the host has not written yet. Told apart by what follows the comma, so the
    // message says which of the two it is rather than only that something is missing.
    const onlySpaceAfter = text.slice(lastComma.at + 1).trim().length === 0;
    return onlySpaceAfter
      ? { reason: 'TrailingComma', ...lastComma }
      : { reason: 'MissingValue', ...lastComma };
  }
  if (expectValue) return { reason: 'MissingValue', line, column };
  return undefined;
}

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

/** Repair a paste that is nearly a theme list but not one yet, and hand it back pretty printed.
 * A host copying a theme out of somewhere gets whatever shape it was stored in: one line, no
 * name, no tint. None of that is a reason to refuse the questions. Only the questions are
 * treated as load bearing — without them there is no theme, and guessing at questions would be
 * inventing the host's game. A missing name and a missing tint are filled in, `defaultName` is
 * numbered for as many themes as came in, and a leftover `id` in an older paste is dropped
 * rather than carried: the name is what a theme is keyed by now. Returns undefined where the
 * text is too far from a theme list to repair, and where two of them would repair to the same
 * name. A comma left standing in front of a closing bracket is repaired too: it is the one
 * piece of broken JSON that arrives from copying rather than from typing. */
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
    // Two themes repaired into one name is still two themes under one name, and the paste is not
    // what the host wrote, so it is refused rather than guessed at.
    if (seen.has(name)) return undefined;
    seen.add(name);
    themes.push({
      name,
      color: isCharacterColor(record.color) ? record.color : 'Yellow',
      questions,
    });
  }
  if (themes.length === 0) return undefined;
  return JSON.stringify(themes, null, 2);
}
