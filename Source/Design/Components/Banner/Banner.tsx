import { ComponentChildren } from "preact";
import styles from "./Banner.module.css";

export type BannerVariant = "Info" | "Success" | "Warning" | "Error";
/** Which way the words line up inside the block. */
export type BannerAlign = "Start" | "Center";
/**
 * The mark at the head of the banner. Info is the one that says something; Loading
 * is the one that says the same thing is still happening.
 */
export type BannerMark = "Info" | "Loading";

export interface BannerProps {
  variant?: BannerVariant;
  align?: BannerAlign;
  /**
   * The mark at the head. One mark for every variant by default, because what the
   * banner says is already in the wording and four marks would make a set of notes
   * read as a set of statuses. Only the mark that has to say more than the words
   * asks for a different one.
   */
  mark?: BannerMark;
  children?: ComponentChildren;
}

/**
 * A short note in a coloured block.
 *
 * The mark leads the text on the left, in every variant.
 */
export function Banner({ variant = "Info", align = "Start", mark = "Info", children }: BannerProps) {
  return (
    <div class={`${styles.Root} ${styles[`Variant${variant}`]} ${styles[`Align${align}`]}`}>
      <span class={`${styles.Icon} ${styles[`Mark${mark}`]}`} aria-hidden="true" />
      <span class={styles.Text}>{children}</span>
    </div>
  );
}
