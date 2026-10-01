import { ComponentChildren } from "preact";
import styles from "./Banner.module.css";

export type BannerVariant = "Info" | "Success" | "Warning" | "Error";
/** Which way the words line up inside the block. */
export type BannerAlign = "Start" | "Center";

export interface BannerProps {
  variant?: BannerVariant;
  align?: BannerAlign;
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
export function Banner({ variant = "Info", align = "Start", children }: BannerProps) {
  return (
    <div class={`${styles.Root} ${styles[`Variant${variant}`]} ${styles[`Align${align}`]}`}>
      <span class={styles.Icon} aria-hidden="true" />
      <span class={styles.Text}>{children}</span>
    </div>
  );
}
