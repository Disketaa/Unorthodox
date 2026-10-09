import { useEffect, useState } from 'preact/hooks';
import type { KeyboardKey } from './Keyboard';
import { Backspace, Enter, Rows, Space } from './Keyboard';

/** What the layout calls the key a physical keydown names. `event.key` for a letter arrives
 * lowercase, and only the layout's own letters are answered, so a key the layout does not draw
 * lights nothing rather than a key that is not there. */
function keyFor(event: KeyboardEvent): KeyboardKey | undefined {
  if (event.key === 'Backspace') return Backspace.key;
  if (event.key === ' ') return Space.key;
  if (event.key === 'Enter') return Enter.key;
  const letter = event.key.toUpperCase();
  return Rows.some((row) => row.includes(letter)) ? letter : undefined;
}

/** Which keys a hardware keyboard is holding down right now, so that pressing one is seen on the
 * on-screen layout too. Held as a set rather than a single key because a hand can have two down
 * at once while typing quickly. */
export function useHeldKeys(enabled: boolean): ReadonlySet<KeyboardKey> {
  const [held, setHeld] = useState<ReadonlySet<KeyboardKey>>(() => new Set());

  useEffect(() => {
    if (!enabled) return;
    const set = (key: KeyboardKey, down: boolean) =>
      setHeld((current) => {
        if (current.has(key) === down) return current;
        const next = new Set(current);
        if (down) next.add(key);
        else next.delete(key);
        return next;
      });
    const onDown = (event: KeyboardEvent) => {
      const key = keyFor(event);
      if (key !== undefined) set(key, true);
    };
    const onUp = (event: KeyboardEvent) => {
      const key = keyFor(event);
      if (key !== undefined) set(key, false);
    };
    // A keydown whose keyup arrives after the window has lost focus would otherwise
    // stay held forever, so losing focus releases everything.
    const onBlur = () => setHeld(new Set());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled]);

  return held;
}
