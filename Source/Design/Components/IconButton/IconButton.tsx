import { playSound, type SoundName } from '../../Sounds';
import styles from './IconButton.module.css';

/** The marks that stand in for a button's own label. */
export type IconName = 'Exit' | 'Kick';
export interface IconButtonProps {
  icon: IconName;
  /** What the button does, for anyone who cannot see the mark. */
  label: string;
  /** Small sits inside another control, where the button is part of it rather than beside it;
   * Medium stands on its own. */
  size?: 'Small' | 'Medium';
  onClick: () => void;
  /** The clip on press, or `false` to stay silent. */
  sound?: SoundName | false;
}

/** A button carrying nothing but a mark, with the name in the label rather than in the drawing.
 * The mark is a span rather than an image element so the icon file stays where the rest of the
 * artwork is, and is painted through a mask: every icon on disk is a black silhouette, and a
 * mask is what lets one file serve a mark in any colour. Held back until the pointer is on it,
 * then the accent: nothing in the room should spend the accent on itself, so the colour is
 * spent on the thing being aimed at. A rounded square rather than a circle, because a circle is
 * a shape the eye reads as a control on its own, and these sit inside a chip or beside a title
 * where the box is already the control. */
export function IconButton({
  icon,
  label,
  size = 'Medium',
  sound = 'Pop',
  onClick,
}: IconButtonProps) {
  return (
    <button
      type="button"
      class={`${styles.Root} ${styles[`Size${size}`]} ${styles[`Icon${icon}`]}`}
      aria-label={label}
      title={label}
      onClick={() => {
        if (sound) playSound(sound);
        onClick();
      }}
    >
      <span class={styles.Icon} aria-hidden="true" />
    </button>
  );
}
