import { useEffect, useRef } from 'preact/hooks';

/** Whether the key event went to a field the browser is already typing into. The answer box is a
 * real input above these keys, so a keydown reaching it would be counted twice: once by the
 * browser and once by these keys. */
function isTypingElsewhere(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

/** Call the listener for as long as the keyboard is on. A held key repeats on the operating
 * system's own events rather than on a timer here, so the delay and the rate are the ones this
 * player's keyboard is set to, the same as in every other program they use. */
export function useHardwareTyping(
  enabled: boolean,
  name: (event: KeyboardEvent) => string | undefined,
  onPress: (key: string) => void,
): void {
  const latest = useRef({ name, onPress });
  latest.current = { name, onPress };

  useEffect(() => {
    if (!enabled) return;
    const onDown = (event: KeyboardEvent) => {
      const key = latest.current.name(event);
      if (key === undefined) return;
      if (isTypingElsewhere(event)) return;
      latest.current.onPress(key);
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [enabled]);

  return undefined;
}
