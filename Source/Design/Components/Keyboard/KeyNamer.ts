import { Backspace, Enter, Space } from './Keyboard';

/** The physical keys of a QWERTY board, row by row, in the order a ЙЦУКЕН layout puts its
 * letters — including the bracket and punctuation keys, which is where the extra letters live. */
const Positions: readonly (readonly string[])[] = [
  [
    'KeyQ',
    'KeyW',
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY',
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
  ],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
];

/** What the layout calls the key a physical keydown names, read from the key's position rather
 * than its character: the layout decides the letter, so an English board pressing `KeyA`
 * answers with `Ф` rather than with an `A` the layout does not draw. */
export function keyNamer(
  rows: readonly (readonly string[])[],
): (event: KeyboardEvent) => string | undefined {
  const byPosition = new Map<string, string>();
  Positions.forEach((positions, row) => {
    positions.forEach((code, column) => {
      const letter = rows[row]?.[column];
      if (letter !== undefined) byPosition.set(code, letter);
    });
  });
  return (event) => {
    if (event.key === 'Backspace') return Backspace.key;
    if (event.key === ' ') return Space.key;
    if (event.key === 'Enter') return Enter.key;
    return byPosition.get(event.code);
  };
}
