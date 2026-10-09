import styles from './Keyboard.module.css';
import type { KeyboardKey } from './Keyboard';

export interface KeyProps {
  keyName: KeyboardKey;
  /** How many times this key has been pressed. The element is keyed on it by the caller, so a
   * press is a new element and the pop runs from the start: a press and a release inside one
   * frame would otherwise paint nothing, and a key held lit would go out late. */
  pressCount: number;
  disabled: boolean;
  /** The mark class for the one key that carries a drawn icon rather than a letter, so it can be
   * masked from the key's own text colour rather than carrying a colour of its own. */
  icon?: string;
  label?: string;
  glyph?: string;
  extra?: string;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** One key: a letter, a glyph, or a drawn mark. */
export function Key({
  keyName,
  pressCount,
  disabled,
  icon,
  label,
  glyph,
  extra,
  onKeyPress,
}: KeyProps) {
  const classes = [
    styles.Key,
    pressCount > 0 ? styles.KeyPopped : '',
    icon ?? '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      class={classes}
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={() => onKeyPress?.(keyName)}
    >
      {icon === undefined && (glyph ?? keyName)}
      {icon !== undefined && <span class={styles.Icon} aria-hidden="true" />}
    </button>
  );
}
