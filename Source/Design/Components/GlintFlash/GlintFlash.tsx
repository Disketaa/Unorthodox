import { useEffect } from 'preact/hooks';
import { playSound } from '../../Sounds';
import { useGlintVariant } from '../Glint';
import styles from './GlintFlash.module.css';

/** How the shine goes: burned away at once, or held for a beat and then let go. */
export type GlintFlashVariant = 'Flash' | 'Wash';

export interface GlintFlashProps {
  /** How the shine goes. */
  variant?: GlintFlashVariant;
  /** Whether the enchantment is said out loud as well as shown. */
  sound?: boolean;
  /** Whether the shine is laid over the whole window rather than over the thing it belongs to.
   * The room being flashed is a different thing from a seat being flashed: one is a card of the
   * board and the other is everything the room is looking at. */
  full?: boolean;
}

/** The shine the round's enchantment lays over whatever it has touched and then takes away: the
 * one mechanic behind a seat that flashes, the wash behind the word that arrives, and the shine
 * over a card the enchantment reached. */
export function GlintFlash({
  variant = 'Flash',
  sound = false,
  full = false,
}: GlintFlashProps) {
  const tile = useGlintVariant();
  useEffect(() => {
    if (sound) playSound('Enchant');
  }, [sound]);
  return (
    <span
      class={`${styles.Root} ${styles[variant]} ${styles[`Glint${tile}`]} ${full ? styles.Full : ''}`}
      aria-hidden="true"
    />
  );
}
