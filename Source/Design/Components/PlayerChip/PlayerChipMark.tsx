import styles from './PlayerChipMark.module.css';

/** The marks that can sit at the end of a chip. */
export type PlayerChipMarkIcon = 'Crown' | 'Kick';

export interface PlayerChipMarkProps {
  icon: PlayerChipMarkIcon;
  /**
   * What the mark does, for anyone who cannot see it.
   *
   * Required whenever the mark is pressed, and ignored when it only draws.
   */
  label?: string;
  /** Given, the mark becomes a button. Left out, it stays a drawn shape. */
  onClick?: () => void;
}

/**
 * One mark at the end of a chip, either drawn or pressed.
 *
 * Both ends of a chip are the same shape of control: a small mark in the accent
 * colour, at the far side, sized against the text beside it. Only the drawing and
 * what it does differ, so those are all this takes.
 *
 * A mark that does nothing is drawn as a span, because a button that does nothing
 * is a control the player can find, focus and press for no reason. One that does
 * something is a real button, so it can be reached by keyboard and announced.
 */
export function PlayerChipMark({ icon, label = '', onClick }: PlayerChipMarkProps) {
  const shape = <span class={`${styles.Mark} ${styles[icon]}`} aria-hidden="true" />;
  if (onClick === undefined) {
    return shape;
  }
  return (
    <button
      type="button"
      class={styles.Button}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {shape}
    </button>
  );
}
