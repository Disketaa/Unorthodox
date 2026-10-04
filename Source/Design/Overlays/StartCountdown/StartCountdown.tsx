import { useSwayMotion } from '@/Design/Primitives';
import styles from './StartCountdown.module.css';
import swayStyles from '../../Primitives/Sway/Sway.module.css';

export interface StartCountdownProps {
  /** The shade over the room, before there is a number to show. */
  veiling: boolean;
  /** The number on screen, or null while the count has not started. */
  count: number | null;
}

/**
 * The room counting itself in before the first round.
 *
 * The shade comes up first and the numbers follow it, so the first number is not already half
 * faded by the time the room can see anything at all. The layer is the only thing the player
 * can act on while it is up, and acting on it does nothing: the lobby underneath is there to be
 * looked at, not pressed, so every control on it is answered by the shade.
 *
 * It leaves by being taken away rather than by fading. A fade the room had to wait for meant a
 * second animation whose length had to be known to the code before it could hand over, and it
 * was fighting the page fade underneath it the whole time: the writing screen arrives on its
 * own page fade anyway, so the layer simply goes and that fade is the hand-off. One movement,
 * on one element, instead of two that had to agree about when they were finished.
 */
export function StartCountdown({ veiling, count }: StartCountdownProps) {
  if (!veiling && count === null) return null;
  return (
    <div class={styles.Root}>
      <div class={styles.Dim} />
      {count !== null && <Count key={count} value={count} />}
    </div>
  );
}

/**
 * One number, standing there shifting its weight like everything else on the page.
 *
 * The idle sway and the roll behind it are the characters' own, from `Sway`, rather than a
 * second copy of the movement made smaller: a number that swung on its own terms would be a
 * second idle in the interface, and the room reads as one hand drawing everything on it or none
 * of it.
 *
 * Two elements because the two movements are two animations, and an element can only be given
 * one `animation`: the wrapper carries the sway's `transform` and the number inside it carries
 * the pop's `scale` and `opacity`. Composed on one element they would have overwritten each
 * other and the number would either only pop or only swing, and nesting them lets the two do
 * what a character does — settle, then be alive.
 *
 * Keyed by its own value so each number mounts fresh. One element whose text changed would keep
 * the first number's lean, tempo and place in the cycle, and its animation would be on its
 * first run for the rest of the count.
 */
function Count({ value }: { value: number }) {
  const sway = useSwayMotion();
  return (
    <span class={swayStyles.Moving} ref={sway}>
      <span class={styles.Stage}>{value}</span>
    </span>
  );
}
