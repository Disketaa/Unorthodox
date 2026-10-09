import styles from './Keyboard.module.css';
import type { KeyboardKey } from './Keyboard';

export interface KeyProps {
  keyName: KeyboardKey;
  disabled: boolean;
  pressed: boolean;
  label?: string;
  glyph?: string;
  /** The mark class for the one key that carries a drawn icon rather than a letter, so it can be
   * masked from the key's own text colour rather than carrying a colour of its own. */
  icon?: string;
  extra?: string;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** One key: a letter, a glyph, or a drawn mark. */
export function Key({
  keyName,
  disabled,
  pressed,
  label,
  glyph,
  icon,
  extra,
  onKeyPress,
}: KeyProps) {
  return (
    <button
      class={keyClass(pressed, icon, extra)}
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

function keyClass(pressed: boolean, icon?: string, extra?: string): string {
  return [styles.Key, pressed ? styles.KeyHeld : '', icon ?? '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}
