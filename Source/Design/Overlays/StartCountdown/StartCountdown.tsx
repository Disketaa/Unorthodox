import { useSwayMotion } from '@/Design/Primitives';
import styles from './StartCountdown.module.css';
import swayStyles from '../../Primitives/Sway/Sway.module.css';

export interface StartCountdownProps {
  /** The shade over the room, before there is a number to show. */
  veiling: boolean;
  /** The number on screen, or null while the count has not started. */
  count: number | null;
}

/** The room counting itself in before the first round. The shade comes up first, so the first
 * number is not already half faded. It leaves by being taken away, not by fading: the writing
 * screen arrives on its own page fade, so that is the hand-off. */
export function StartCountdown({ veiling, count }: StartCountdownProps) {
  if (!veiling && count === null) return null;
  return (
    <div class={styles.Root}>
      <div class={styles.Dim} />
      {count !== null && <Count key={count} value={count} />}
    </div>
  );
}

/** One number, standing there shifting its weight like everything else on the page. The sway and
 * the roll are the characters' own, from `Sway`: a number swinging on its own terms would be a
 * second idle. Two elements, since one carries one `animation`. */
function Count({ value }: { value: number }) {
  const sway = useSwayMotion();
  return (
    <span class={swayStyles.Moving} ref={sway}>
      <span class={styles.Stage}>{value}</span>
    </span>
  );
}
