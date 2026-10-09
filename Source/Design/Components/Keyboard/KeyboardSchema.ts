import { Layouts, type KeyboardLang } from './KeyboardLayouts';

/** The two shapes a keyboard can be laid out in, reduced to one key's worth of letters each: the
 * key under the player's `A` is enough to tell a Russian board from an English one, and one key
 * can be wrong where several cannot. */
const probe = (rows: readonly (readonly string[])[]): ReadonlySet<string> =>
  new Set(rows.flat().map((letter) => letter.toUpperCase()));

const russian = probe(Layouts.ru);
const english = probe(Layouts.en);

/** Only Chromium answers this, and it hands back every key on the board rather than a name for
 * the layout, so the reading of it is ours. Reached through `Reflect` rather than read off
 * `navigator` directly: the API is in neither the DOM types nor Firefox or Safari. */
interface LayoutMap {
  get(code: string): string[] | undefined;
}

/** What was found last time, kept for the session. The keyboard is rebuilt for every round, and
 * asking on each of those would report a change on every one of them, for a player whose board
 * has not moved since the first. */
let known: KeyboardLang | undefined;

/** The layout this session has settled on, or undefined while it is still unknown. Read as the
 * keyboard opens, so the keys come up already right rather than flipping after they are drawn. */
export function knownLayout(): KeyboardLang | undefined {
  return known;
}

/** What the keyboard is actually set to, or undefined when the browser will not say. Absent is
 * the ordinary answer on Firefox and Safari, and is not a failure: the player picks the layout
 * by hand there, and the on-screen key does that for them. */
export async function detectLayout(): Promise<KeyboardLang | undefined> {
  if (known !== undefined) return known;
  const keyboard: unknown = Reflect.get(navigator, 'keyboard');
  if (typeof keyboard !== 'object' || keyboard === null) return undefined;
  const getLayoutMap: unknown = Reflect.get(keyboard, 'getLayoutMap');
  if (typeof getLayoutMap !== 'function') return undefined;
  try {
    const map: LayoutMap = await Reflect.apply(getLayoutMap, keyboard, []);
    const pressed = ['KeyA', 'KeyD', 'KeyS']
      .map((code) => map.get(code)?.[0]?.toUpperCase())
      .filter((key): key is string => key !== undefined);
    if (pressed.length === 0) return undefined;
    if (pressed.every((key) => russian.has(key))) known = 'ru';
    if (pressed.every((key) => english.has(key))) known = 'en';
    // A board that is neither is a third language or a board mid-switch. Guessing would put
    // letters on the keys that do not match what the player is pressing, so nothing is cached.
    return known;
  } catch {
    // The browser can refuse outright, which it does rather than answer for a key it thinks is
    // sensitive. That is a reason to fall back, not to fail.
    return undefined;
  }
}
