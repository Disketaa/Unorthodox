import styles from './IconButton.module.css';

/** The marks that stand in for a button's own label. */
export type IconName = 'Exit' | 'Kick';
/** How strongly the mark is drawn, which is how it says how much it matters. */
export type IconTone = 'Accent' | 'Muted';

export interface IconButtonProps {
  icon: IconName;
  /** What the button does, for anyone who cannot see the mark. */
  label: string;
  tone?: IconTone;
  onClick: () => void;
}

/**
 * A button carrying nothing but a mark, with the name in the label rather than in
 * the drawing.
 *
 * The mark is a span rather than an image element so the icon file stays where the
 * rest of the artwork is, and is painted through a mask: every icon on disk is a
 * black silhouette, and a mask is what lets one file serve a mark in any colour.
 *
 * A rounded square rather than a circle, because a circle is a shape the eye reads
 * as a control on its own, and these sit inside a chip or beside a title where the
 * box is already the control.
 */
export function IconButton({ icon, label, tone = 'Accent', onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      class={`${styles.Root} ${styles[`Tone${tone}`]} ${styles[`Icon${icon}`]}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <span class={styles.Icon} aria-hidden="true" />
    </button>
  );
}
