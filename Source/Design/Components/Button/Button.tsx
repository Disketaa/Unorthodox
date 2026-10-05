import { ComponentChildren } from "preact";
import { playSound, type SoundName } from "../../Sounds";
import styles from "./Button.module.css";

export type ButtonVariant = "Primary" | "Secondary" | "Ghost" | "Muted";
export type ButtonSize = "Small" | "Medium" | "Large";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** A slow breath on the surface, for the one control on a screen the room is waiting on. */
  pulse?: boolean;
  sound?: SoundName | false;
  onClick?: () => void;
  children?: ComponentChildren;
}

export function Button({
  variant = "Primary",
  size = "Medium",
  disabled = false,
  loading = false,
  pulse = false,
  sound = "Pop",
  onClick,
  children,
}: ButtonProps) {
  const classes = [
    styles.Root,
    styles[`Variant${variant}`],
    styles[`Size${size}`],
    pulse ? styles.Pulse : "",
  ].join(" ");
  return (
    <button
      class={classes}
      disabled={disabled || loading}
      onClick={() => {
        if (sound) playSound(sound);
        onClick?.();
      }}
    >
      {loading ? "..." : children}
    </button>
  );
}
