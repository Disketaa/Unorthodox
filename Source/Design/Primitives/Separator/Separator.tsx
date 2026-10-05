import { ComponentChildren } from 'preact';
import styles from './Separator.module.css';

export interface SeparatorProps {
  /** The word sitting in the gap, naming what is below it. Optional. A card holding two
   * different things needs a line saying where one ends, and a word in that line says they are
   * not the same thing rather than merely not attached. */
  children?: ComponentChildren;
}

/** A full-width rule with a word in it, for splitting one card into parts. The line is a flex
 * child rather than a border on the word, so both runs are the same rule and the word carries a
 * background to cut it: a rule stopping short would read as two. */
export function Separator({ children }: SeparatorProps) {
  return (
    <div class={styles.Root} role={children === undefined ? 'separator' : undefined}>
      <span class={styles.Line} aria-hidden="true" />
      {children !== undefined && <span class={styles.Label}>{children}</span>}
      <span class={styles.Line} aria-hidden="true" />
    </div>
  );
}
