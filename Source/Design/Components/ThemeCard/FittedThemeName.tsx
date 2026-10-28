import { useRef } from 'preact/hooks';
import { useFittedText } from '../AnswerCard/UseFittedText';
import styles from './ThemeCard.module.css';

/** The theme's name in the room the card gives it, made smaller until it holds rather than cut
 * off at the edge — the same fitter the answer cards use. */
export function FittedThemeName({ name }: { name: string }) {
  const label = useRef<HTMLSpanElement>(null);
  useFittedText(label, name, '--ThemeCard-Fit');
  return (
    <span class={styles.NameRoom}>
      <span class={styles.Name} ref={label}>
        {name}
      </span>
    </span>
  );
}
