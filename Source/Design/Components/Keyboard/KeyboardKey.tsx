import styles from './Keyboard.module.css';
import type { KeyboardKey } from './Keyboard';

export interface KeyProps {
  keyName: KeyboardKey;
  disabled: boolean;
  pressed: boolean;
  label?: string;
  glyph?: string;
  extra?: string;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** One key: a letter, or a glyph with a name of its own to read out. */
export function Key({ keyName, disabled, pressed, label, glyph, extra, onKeyPress }: KeyProps) {
  return (
    <button
      class={keyClass(pressed, extra)}
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={() => onKeyPress?.(keyName)}
    >
      {glyph ?? keyName}
    </button>
  );
}

function keyClass(pressed: boolean, extra?: string): string {
  return [styles.Key, pressed ? styles.KeyHeld : '', extra ?? ''].filter(Boolean).join(' ');
}