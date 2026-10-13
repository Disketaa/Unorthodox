import { Layouts, type KeyboardLang } from './KeyboardLayouts';

/** Which letter set this player last chose by hand, in localStorage rather than in state: the
 * choice is about the player and not the round, and the keyboard is rebuilt every round. */
const ChoiceKey = 'unorthodox.keyboard.lang';

/** The layout the player chose, or undefined while they have never chosen one. Checked against
 * the layouts rather than trusted, being the one place here reading a shape it did not write. */
export function chosenLayout(): KeyboardLang | undefined {
  try {
    const stored: unknown = localStorage.getItem(ChoiceKey);
    return isLang(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** Whether what came out of storage names a layout this build actually has keys for. A name left
 * behind by a version that had a third one is not a layout, and is read as no choice at all. */
function isLang(value: unknown): value is KeyboardLang {
  return typeof value === 'string' && Object.keys(Layouts).includes(value);
}

/** Remember the layout the player chose. Storage may be unavailable, which costs them the choice
 * across a refresh and nothing else, so it is not worth failing over. */
export function saveChosenLayout(lang: KeyboardLang): void {
  try {
    localStorage.setItem(ChoiceKey, lang);
  } catch {
    // Private mode or a full quota, as with every other thing kept here.
  }
}
