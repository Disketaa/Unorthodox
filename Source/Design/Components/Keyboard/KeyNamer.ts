import { Backspace, Enter, Space } from './Keyboard';

/** What the layout calls the key a physical keydown names. Answers nothing for a key the layout
 * does not draw, so a press lights only a letter the keys on screen actually have. Built once
 * per language: per render would resubscribe the window's listeners on every frame. */
export function keyNamer(
  letters: ReadonlySet<string>,
): (event: KeyboardEvent) => string | undefined {
  return (event) => {
    if (event.key === 'Backspace') return Backspace.key;
    if (event.key === ' ') return Space.key;
    if (event.key === 'Enter') return Enter.key;
    const letter = event.key.toUpperCase();
    return letters.has(letter) ? letter : undefined;
  };
}
