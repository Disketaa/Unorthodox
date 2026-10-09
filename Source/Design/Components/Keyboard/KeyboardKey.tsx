import { useCallback } from 'preact/hooks';
import type { VNode } from 'preact';
import styles from './Keyboard.module.css';
import { Lang, type KeyboardKey } from './Keyboard';
import { useHoldRepeat } from './UseHoldRepeat';

export interface KeyProps {
  keyName: KeyboardKey;
  /** How many times this key has been pressed. The element is keyed on it by the caller, so a
   * press is a new element and the pop runs from the start: a press and a release inside one
   * frame would otherwise paint nothing, and a key held lit would go out late. */
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
  return repeats ? hold : { ...hold, onPointerDown: undefined, onPointerUp: undefined };
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
  return (
    <button
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
