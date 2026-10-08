import type { ComponentChildren } from 'preact';
import styles from './CenterStage.module.css';

/** One mark alone in the middle of the window, in the count-in's own hand. Shared rather than
 * drawn twice, since a count and a held room are the same gesture in the same place. */
export function CenterStage({ children }: { children: ComponentChildren }) {
  return (
    <div class={styles.Root}>
      <span class={styles.Stage}>{children}</span>
    </div>
  );
}
