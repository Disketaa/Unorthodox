import { useCallback, useEffect, useRef } from 'preact/hooks';
import type { VNode } from 'preact';
import styles from './Keyboard.module.css';
import { Lang, type KeyboardKey } from './Keyboard';
import { useHoldRepeat } from './UseHoldRepeat';

export interface KeyProps {
  keyName: KeyboardKey;
  /** How many times this key has been pressed. The pop is restarted off it rather than the key
   * being rebuilt on it: a key remounted per press would take the hold-repeat timer with it, so
   * a held key would fire once and then stop. */
  pressCount: number;
  disabled: boolean;
  /** Whether holding this key repeats it. Off for the language key, which swaps two layouts and
   * would swap them again on every repeat — a held language key flickering between scripts. */
  repeats?: boolean;
  /** The mark class for the one key that carries a drawn icon rather than a letter, so it can be
   * masked from the key's own text colour rather than carrying a colour of its own. */
  icon?: string;
  label?: string;
  glyph?: string;
  extra?: string;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** The listeners for a key, which repeat while held unless it is one of the keys a press should
 * not repeat. The repeat is set up either way — the hook cannot be called conditionally — and
 * the listeners are simply not put on the button for a key that does not take them. */
function useKeyPress(
  keyName: KeyboardKey,
  repeats: boolean,
  onKeyPress: ((key: KeyboardKey) => void) | undefined
) {
  const fire = useCallback(() => onKeyPress?.(keyName), [onKeyPress, keyName]);
  const hold = useHoldRepeat(fire);
  return repeats ? hold : { ...hold, onPointerDown: undefined };
}

/** One key: a letter, a glyph, or a drawn mark. */
export function Key({
  keyName,
  pressCount,
  disabled,
  repeats = true,
  icon,
  label,
  glyph,
  extra,
  onKeyPress,
}: KeyProps) {
  const hold = useKeyPress(keyName, repeats, onKeyPress);
  const button = useRef<HTMLButtonElement>(null);
  // The pop is restarted by hand: dropping the class and putting it back on the same element is
  // what makes the animation run again, where a class that merely stays on would play once and
  // then sit there. The reflow read in between is what makes the browser notice the change.
  useEffect(() => {
    const node = button.current;
    if (node === null || pressCount === 0) return;
    node.classList.remove(styles.KeyPopped);
    void node.offsetWidth;
    node.classList.add(styles.KeyPopped);
  }, [pressCount]);
  return (
    <button
      ref={button}
      class={keyClass(pressCount, icon, extra)}
      type="button"
      disabled={disabled}
      aria-label={label}
      {...hold}
    >
      {icon === undefined && (glyph ?? keyName)}
      {icon !== undefined && <span class={styles.Icon} aria-hidden="true" />}
    </button>
  );
}

/** The classes a key carries. The pop is not one of them: it is put on and taken off the element
 * by hand, so that a second press restarts it rather than leaving it already running. */
function keyClass(pressCount: number, icon?: string, extra?: string): string {
  return [styles.Key, pressCount > 0 ? styles.KeyPopped : '', icon ?? '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

/** The language key, which swaps the letters rather than typing one, and so is the one key here
 * that a press does not repeat. Split out so the repeating keys carry no condition at all. */
export function LangKey(props: Omit<KeyProps, 'repeats' | 'keyName'>): VNode {
  return <Key {...props} keyName={Lang.key} repeats={false} />;
}
