import { GameConfig } from '@/Game';
import type { KeyboardKey } from '@/Design';

/** A key's effect on the draft, or on the room when the key sends it. The field is the only
 * place the draft lives, so the keyboard only reports what was pressed, and an answer sent from
 * enter is the same send as the button under the keys. */
export function pressKey(
  key: KeyboardKey,
  value: string,
  canSubmit: boolean,
  onValueChange: (value: string) => void,
  onSubmit: () => void
): void {
  if (key === 'Enter') {
    if (canSubmit) onSubmit();
    return;
  }
  if (key === 'Backspace') {
    onValueChange(value.slice(0, -1));
    return;
  }
  const letter = key === 'Space' ? ' ' : key;
  if (value.length >= GameConfig.limits.answerMaxLength) return;
  onValueChange(value + letter);
}
