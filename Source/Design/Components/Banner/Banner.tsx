import { ComponentChildren } from "preact";
import styles from "./Banner.module.css";

export type BannerVariant = "Info" | "Success" | "Warning" | "Error";

export interface BannerProps {
  variant?: BannerVariant;
  children?: ComponentChildren;
}

/**
 * A short note in a coloured block.
 *
 * The mark leads the text on the left, in every variant. One mark for all of them
 * rather than a mark per meaning: what the banner says is already in the wording, and
 * four different marks would make the note read as a set of statuses rather than as
 * one sentence.
 */
export function Banner({ variant = "Info", children }: BannerProps) {
  return (
    <div class={`${styles.Root} ${styles[`Variant${variant}`]}`}>
      <span class={styles.Icon} aria-hidden="true" />
      <span class={styles.Text}>{children}</span>
    </div>
  );
}
