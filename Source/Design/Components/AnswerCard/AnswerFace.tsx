import { ComponentChildren } from 'preact';
import { FittedAnswer } from './FittedAnswer';
import styles from './AnswerCard.module.css';

/** What is written on the card: the answer, fitted to the box it is given, and the figure behind
 * it. The panel and the grain are decoration on a surface the card paints itself, so they are
 * spans rather than layout elements: a `Card` here would fight the button's own box. */
export function Face({
  text,
  count,
  named,
}: {
  text: string;
  count: number;
  named: number;
}): ComponentChildren {
  const shared = count > 1;
  const shown = shared ? Math.min(count, named) : count;
  const held = shared && named === 0;
  return (
    <>
      {/* The figure inside the panel rather than beside it, which is the arrangement the theme card
       * uses and the whole reason the panel is there. Out here the panel is an empty box cropping
       * nothing and the mark hangs past the corner with nothing holding it in. */}
      <span class={styles.Panel} aria-hidden="true">
        {!held && shown >= 1 && (
          <span class={styles.Mark} aria-hidden="true">
            {shown}
          </span>
        )}
      </span>
      <span class={styles.Noise} aria-hidden="true" />
      <FittedAnswer text={text} />
    </>
  );
}
