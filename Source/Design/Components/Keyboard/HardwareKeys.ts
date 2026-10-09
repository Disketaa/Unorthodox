import { useEffect, useRef } from 'preact/hooks';
import { repeatWhileHeld } from './KeyRepeat';

type Stop = () => void;

/** Whether the key event went to a field the browser is already typing into. The answer box is a
 * real input above these keys, so a keydown reaching it would be counted twice: once by the
 * browser and once by these keys. */
function isTypingElsewhere(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

/** Call the listener for as long as the keyboard is on. The caller's press is held in a ref
 * rather than read from the props: a caller hands over a new function every render, and
 * listening on that would take the keys off and put them back on every frame. */
export function useHardwareTyping(
  enabled: boolean,
  name: (event: KeyboardEvent) => string | undefined,
  onPress: (key: string) => void,
): void {
  const latest = useRef({ name, onPress });
  latest.current = { name, onPress };

  useEffect(() => {
    if (!enabled) return;
    const repeating = new Map<string, Stop>();
    const stopAll = () => {
      repeating.forEach((stop) => stop());
      repeating.clear();
    };
    // The operating system's own repeats are dropped and the hold repeated here instead, since
    // the game's ramp is what a player is typing against.
    const onDown = (event: KeyboardEvent) => {
      const key = latest.current.name(event);
      if (key === undefined || event.repeat) return;
      if (isTypingElsewhere(event)) return;
      latest.current.onPress(key);
      repeating.set(key, repeatWhileHeld(() => latest.current.onPress(key)));
    };
    const onUp = (event: KeyboardEvent) => {
      const key = latest.current.name(event);
      if (key === undefined) return;
      repeating.get(key)?.();
      repeating.delete(key);
    };
    // A keydown whose keyup arrives after the window lost focus would otherwise keep repeating
    // into an answer nobody is watching being written.
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', stopAll);
    return () => {
      stopAll();
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', stopAll);
    };
  }, [enabled]);

  return undefined;
}
