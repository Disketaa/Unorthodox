import { ComponentChildren } from 'preact';
import { playSound, type SoundName } from '../../Sounds';
import type { Accent } from '@/Core';
import styles from './Button.module.css';

export type ButtonVariant = 'Primary' | 'Secondary' | 'Ghost' | 'Muted';
export type ButtonSize = 'Small' | 'Medium' | 'Large';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** A slow breath on the surface, for the one control on a screen the room is waiting on. */
  pulse?: boolean;
  /** Whether this button is one of several and is the one that is on. Draws as `Primary` and
   * says so to the browser as well, since a row of toggles that only shows its state as a fill
   * is a row nobody can read with the fill turned off. */
  pressed?: boolean;
  /** Added to the button's own classes, for a caller that lays a row of these out itself rather
   * than letting the row size each of them by its own name. */
  class?: string;
  /** An accent of this button's own, which it paints itself in rather than in the room's. For a
   * control that belongs to one thing rather than to the room: a theme's own button looks like
   * that theme once pressed. Worn rather than filled, and it goes with `pressed` not a variant. */
  accent?: Accent;
  sound?: SoundName | false;
  onClick?: () => void;
  children?: ComponentChildren;
}

/** The three CSS custom properties an accent button paints itself from, or nothing at all where
 * it has no accent of its own — in which case the room's own variants are what it wears. */
function paintedIn(accent: Accent | undefined): Record<string, string> {
  if (accent === undefined) return {};
  return {
    '--Color-Accent-Ink': accent.ink,
    '--Color-Accent-Wash': accent.wash,
  };
}

export function Button({
  variant = 'Primary',
  size = 'Medium',
  disabled = false,
  loading = false,
  pulse = false,
  pressed,
  class: className,
  accent,
  sound = 'Pop',
  onClick,
  children,
}: ButtonProps) {
  // An accent button has no variant of its own to fall back on: the named fills are the room's
  // colours and would fight the accent it was handed.
  const classes = [
    styles.Root,
    accent === undefined
      ? styles[`Variant${pressed === true ? 'Primary' : variant}`]
      : styles.Accent,
    styles[`Size${size}`],
    pulse ? styles.Pulse : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const painted = paintedIn(accent);
  return (
    <button
      class={classes}
      style={painted}
      disabled={disabled || loading}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
      onClick={() => {
        if (sound) playSound(sound);
        onClick?.();
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}
