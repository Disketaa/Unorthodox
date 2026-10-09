import { useEffect, useRef } from 'preact/hooks';

/** Whether the browser is already typing this keypress into a field of its own. A field the game
 * fills in from its own keys is read-only, and a read-only field is left alone by the browser,
 * so those keys are ours to answer rather than a letter the field would have taken for itself. */
function isTypingElsewhere(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return !target.readOnly;
  }
  return target.isContentEditable;
}

/** Whether a combination is the one that swaps the letters. Alt and Shift together, or Ctrl and
 * Shift, because Ctrl and Alt on their own are not available to mean anything: that pair is
 * AltGr, which is how a player types the symbols that are not on the letters. */
function isLayoutSwitch(event: KeyboardEvent): boolean {
  return event.shiftKey && (event.altKey || event.ctrlKey);
}

/** Call the listener for as long as the keyboard is on. A held key repeats on the operating
 * system's own events rather than on a timer here, so the delay and the rate are the ones this
 * player's keyboard is set to, the same as in every other program they use. */
export function useHardwareTyping(
  enabled: boolean,
  name: (event: KeyboardEvent) => string | undefined,
  onPress: (key: string) => void,
  onSwitch: () => void
): void {
  const latest = useRef({ name, onPress, onSwitch });
  latest.current = { name, onPress, onSwitch };

  useEffect(() => {
    if (!enabled) return;
    const onDown = (event: KeyboardEvent) => {
      if (isLayoutSwitch(event)) {
        latest.current.onSwitch();
        return;
      }
      // AltGr and the other modified presses are reaching the window as ordinary letters on the
      // key's position, so a player typing a symbol would write a letter instead of it.
      if (event.altKey || event.ctrlKey || event.metaKey) return;
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
