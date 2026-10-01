import { ComponentChildren } from 'preact';
import styles from './Separator.module.css';

export interface SeparatorProps {
  /**
   * The word sitting in the gap, naming what is below it.
   *
   * Optional, and a separator without one is still a separator. It is here because
   * a card holding two different things needs a line saying where one ends, and a
   * word in that line is what tells the reader the two are not the same thing
   * rather than merely not attached.
   */
  children?: ComponentChildren;
}

/**
 * A full-width rule with a word in it, for splitting one card into parts.
 *
 * The line is a flex child rather than a border on the word, so the two runs of it
 * are the same rule either side of the text and the whole thing is one row that
 * fills whatever width it is given. Each run sits on the row's own centre line, so
 * the word has to carry a background to cut the rule: there is no gap here to draw
 * the line around, and a rule that stopped short of the word would read as two
 * rules rather than as one broken by a label.
 *
 * Carries `separator` only when it is a bare rule. A labelled one is not a
 * separator to a screen reader, it is a label on the part below it, and the
 * separator role would announce the word as the name of a line rather than as the
 * name of the group.
 *
 * Quiet, like every other hairline in the interface. It is saying where a boundary
 * is, not drawing attention to the boundary itself.
 */
export function Separator({ children }: SeparatorProps) {
  return (
    <div class={styles.Root} role={children === undefined ? 'separator' : undefined}>
      <span class={styles.Line} aria-hidden="true" />
      {children !== undefined && <span class={styles.Label}>{children}</span>}
      <span class={styles.Line} aria-hidden="true" />
    </div>
  );
}
