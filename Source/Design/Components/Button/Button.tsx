import { ComponentChildren } from "preact";
import styles from "./Button.module.css";

export type ButtonVariant = "Primary" | "Secondary" | "Ghost";
export type ButtonSize = "Small" | "Medium" | "Large";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children?: ComponentChildren;
}

export function Button({
  variant = "Primary",
  size = "Medium",
  disabled = false,
  loading = false,
  onClick,
  children,
}: ButtonProps) {
  const classes = `${styles.Root} ${styles[`Variant${variant}`]} ${styles[`Size${size}`]}`;
  return (
    <button
      class={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? "..." : children}
    </button>
  );
}