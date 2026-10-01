import { ComponentChildren } from "preact";
import styles from "./Banner.module.css";

export type BannerVariant = "Info" | "Success" | "Warning" | "Error" | "Muted" | "Accent";
/** Which way the words line up inside the block. */
export type BannerAlign = "Start" | "Center";
/**
 * The mark at the head of the banner. Info is the one that says something; Loading
 * is the one that says the same thing is still happening; Clock says the line is
 * about a length of time rather than about a state.
 */
export type BannerMark = "Info" | "Loading" | "Clock";

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
  /**
   * The figure at the end of the line, held against the right edge.
   *
   * Present only where the block is a setting rather than a note: a value the eye
   * is meant to compare down the column, which is the whole point of putting the
   * words on the left and the number at the far end rather than together.
   */
  value?: string;
  children?: ComponentChildren;
}

/**
 * A short note in a coloured block, or a named setting with its value.
 *
 * The mark leads the text on the left, in every variant.
 */
export function Banner({
  variant = "Info",
  align = "Start",
  mark = "Info",
  value,
  children,
}: BannerProps) {
  return (
    <div class={`${styles.Root} ${styles[`Variant${variant}`]} ${styles[`Align${align}`]}`}>
      <span class={`${styles.Icon} ${styles[`Mark${mark}`]}`} aria-hidden="true" />
      <span class={styles.Text}>{children}</span>
      {value !== undefined && <span class={styles.Value}>{value}</span>}
    </div>
  );
}
