import { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useFittedText } from './UseFittedText';
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

/** The answer itself, which measures itself into the card rather than being cut off at its edge.
 * Its own element inside the centring room rather than text straight into it: as bare text it
 * is sized to its longest line, and a word wider than the card then cannot wrap. */
function FittedAnswer({ text }: { text: string }) {
  const answer = useRef<HTMLSpanElement>(null);
  useFittedText(answer, text);
  return (
    <span class={styles.Room}>
      <span class={styles.Answer} ref={answer}>
        {text}
      </span>
    </span>
  );
}
