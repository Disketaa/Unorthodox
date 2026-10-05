import { useSwayMotion } from '@/Design/Primitives';
import styles from './Wordmark.module.css';

export interface WordmarkProps {
  /** What the mark says, for anyone who cannot see it. */
  label: string;
}

/** The game's name, as the drawing rather than as type. Painted through a mask, like every icon
 * on disk, so the one file serves the mark in whatever the accent is. The artwork is a black
 * silhouette over transparency, and a mask reads only its shape: the colour belongs to the
 * interface, not to the file. Rocks on the same idle sway the characters do, and through the
 * same mechanism, so the name and the cast are one thing moving rather than two. The amplitudes
 * are the same absolute pixels, which is why a mark several times a character's size does not
 * swing further: it is the same movement at a different size, not a bigger one. The name is
 * carried in a span that is hidden from the eye but not from a reader, so the mark is not a
 * picture of a title but the title itself: a screen reader reads it, and the test that guards
 * the join screen still finds the name on the page. */
export function Wordmark({ label }: WordmarkProps) {
  const motionRef = useSwayMotion();
  return (
    <span class={styles.Root} ref={motionRef}>
      <span class={`${styles.Mark} ${styles.Moving}`} aria-hidden="true" />
      <span class={styles.Name}>{label}</span>
    </span>
  );
}