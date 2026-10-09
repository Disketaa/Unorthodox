import { useEffect, useState } from 'preact/hooks';

/** Which keys a hardware keyboard is holding down right now, so a press is seen on the on-screen
 * layout too. A set, since a hand has two down at once. `name` maps a physical key to what the
 * layout calls it and answers nothing for a key the layout does not draw. */
export function useHeldKeys(
  enabled: boolean,
  name: (event: KeyboardEvent) => string | undefined,
): ReadonlySet<string> {
  const [held, setHeld] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (!enabled) return;
    const set = (key: string, down: boolean) =>
      setHeld((current) => {
        if (current.has(key) === down) return current;
        const next = new Set(current);
        if (down) next.add(key);
        else next.delete(key);
        return next;
      });
    const onDown = (event: KeyboardEvent) => {
      const key = name(event);
      if (key !== undefined) set(key, true);
    };
    const onUp = (event: KeyboardEvent) => {
      const key = name(event);
      if (key !== undefined) set(key, false);
    };
    // A keydown whose keyup arrives after the window has lost focus would otherwise stay held
    // forever, so losing focus releases everything.
    const onBlur = () => setHeld(new Set());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled, name]);

  return held;
}
