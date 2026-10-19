import { useRef } from 'preact/hooks';
import { useFittedText } from './UseFittedText';
import styles from './AnswerCard.module.css';

/** Writing measured into the room the card gives it, whatever it says. Its own element inside
 * the centring room rather than text straight into it: as bare text it is sized to its longest
 * line, and a word wider than the card then cannot wrap. */
export function FittedAnswer({ text }: { text: string }) {
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
