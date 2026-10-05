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
 * The mark is a span painted through a mask, so one black silhouette serves any colour. A
 * rounded square, not a circle: the eye reads a circle as a control on its own. */
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
