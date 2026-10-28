/** The card's face, as spans rather than layout elements: the card paints its own surface, so
 * the face is decoration on it and a Stack here would fight the button's own box. Split out of
 * the card so the card's own file stays under the line limit. */
import type { ThemeCardProps } from './ThemeCard';
import { FittedThemeName } from './FittedThemeName';
import styles from './ThemeCard.module.css';
import { RoundMeter } from '../RoundMeter';

export function CardFace({
  name,
  index,
  rounds,
  spent,
  mult,
}: Pick<ThemeCardProps, 'name' | 'index' | 'rounds' | 'spent' | 'mult'>) {
  return (
    <>
      <span class={styles.Mult} aria-hidden="true">
        {mult !== undefined ? `${mult}x` : ''}
      </span>
      <span class={styles.Panel}>
        <span class={styles.Mark} aria-hidden="true">
          {index}
        </span>
      </span>
      <span class={styles.Noise} aria-hidden="true" />
      <FittedThemeName name={name} />
      <RoundMeter rounds={rounds ?? 10} spent={spent ?? 0} />
    </>
  );
}
