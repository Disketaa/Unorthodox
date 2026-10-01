import styles from './ExitButton.module.css';

export interface ExitButtonProps {
  /** What the control does, for anyone who cannot see the mark. */
  label: string;
  onClick: () => void;
}

/**
 * The icon-only control for leaving a room.
 *
 * The name travels as the accessible name rather than as visible text: the mark
 * reads as leaving at a glance, and a word beside it would put a second line of
 * type next to the section heading it shares a row with.
 */
export function ExitButton({ label, onClick }: ExitButtonProps) {
  return (
    <button type="button" class={styles.Root} aria-label={label} title={label} onClick={onClick}>
      <span class={styles.Icon} aria-hidden="true" />
    </button>
  );
}
