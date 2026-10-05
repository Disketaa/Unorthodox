import { useSwayMotion } from '@/Design/Primitives';
import styles from './Wordmark.module.css';

export interface WordmarkProps {
  /** What the mark says, for anyone who cannot see it. */
  label: string;
}

/** The game's name, as the drawing rather than as type. Painted through a mask, like every icon
 * on disk, so one file serves the mark in whatever the accent is. Rocks on the same idle sway
 * as the characters, so the name and cast move as one. */
export function Wordmark({ label }: WordmarkProps) {
  const motionRef = useSwayMotion();
  return (
    <span class={styles.Root} ref={motionRef}>
      <span class={`${styles.Mark} ${styles.Moving}`} aria-hidden="true" />
      <span class={styles.Name}>{label}</span>
    </span>
  );
}
