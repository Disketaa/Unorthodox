import { ComponentChildren } from 'preact';
import { useGlintVariant } from '../Glint';
import styles from './Banner.module.css';

export type BannerVariant = 'Info' | 'Success' | 'Warning' | 'Error' | 'Muted' | 'Accent';
/** Which way the words line up inside the block. */
export type BannerAlign = 'Start' | 'Center';
/** The mark at the head of the banner. Info is the one that says something; Loading is the one
 * that says the same thing is still happening; Clock says the line is about a length of time
 * rather than about a state. */
export type BannerMark = 'Info' | 'Loading' | 'Clock';

export interface BannerProps {
  variant?: BannerVariant;
  align?: BannerAlign;
  /** Whether the banner takes the width of its row rather than the width of its words. Set where
   * the banner is a row in a column rather than a note: a column of banners carries a value
   * each, and values that end wherever their wording does cannot be compared down the edge. */
  fill?: boolean;
  /** The mark at the head. One mark for every variant by default, because what the banner says
   * is already in the wording and four marks would make a set of notes read as a set of
   * statuses. Only the mark that has to say more than the words asks for a different one. */
  mark?: BannerMark;
  /** Words in the mark's place rather than a mark: the enchantment's own figure, which is the
   * one thing at the head of that line that a drawn mark cannot say. Absent everywhere else,
   * and the mark stands as it always did. */
  badge?: string;
  /** The figure at the end of the line, held against the right edge. Only where the block is a
   * setting rather than a note: a value the eye compares down the column, which is why the
   * words are on the left and the number at the far end. */
  value?: string;
  children?: ComponentChildren;
  /** Whether the round's enchanted card reaches this player, which lays the glint over the
   * banner. */
  glinted?: boolean;
}

/** A short note in a coloured block, or a named setting with its value. The mark leads the text
 * on the left, in every variant. */
export function Banner({
  variant = 'Info',
  align = 'Start',
  fill = false,
  mark = 'Info',
  badge,
  value,
  children,
  glinted = false,
}: BannerProps) {
  const variantClass = useGlintVariant();
  const glintClass = glinted ? `${styles.Glint} ${styles[`Glint${variantClass}`]}` : '';
  return (
    <div
      class={`${styles.Root} ${fill ? styles.Fill : ''} ${glinted ? styles.GlintOn : ''} ${styles[`Variant${variant}`]} ${styles[`Align${align}`]}`}
    >
      {glinted && <span class={glintClass} aria-hidden="true" />}
      {badge === undefined && (
        <span
          class={[styles.Icon, styles[`Mark${mark}`]].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
      )}
      {badge !== undefined && <span class={styles.Badge}>{badge}</span>}
      <span class={styles.Text}>{children}</span>
      {value !== undefined && <span class={styles.Value}>{value}</span>}
    </div>
  );
}
