import { useEffect, useState } from 'preact/hooks';
import { playSound } from '../../Sounds';
import { useGlintVariant } from '../../Components/Glint';
import styles from './EnchantedArrival.module.css';

/** How long the word stands before it is taken away, in milliseconds. Long enough to be read
 * once and felt like something that happened, rather than the length of a flash: this is the
 * player being told the round has reached them, and a word they have to catch is not told. */
const HoldMs = 900;

/** How long the word takes to fade once it has stood its beat, in milliseconds. Long enough to
 * read as leaving rather than as being cut off, short enough that it is gone before the phase
 * splash covers the screen it was drawn on. */
const FadeMs = 125;

/** How long the whole arrival lasts, in milliseconds: the word standing and then going. Exported
 * because the bar naming the enchantment waits exactly this long before it appears, and the two
 * are one arrival rather than two events that happen to line up. */
export const EnchantedArrivalMs = HoldMs + FadeMs;

export interface EnchantedArrivalProps {
  /** Whether the round's enchanted card has reached this player. The word is shown while it
   * holds and is then taken away while the enchantment itself carries on to the end of the
   * phase, since what has to be said is said once rather than every render. */
  enchanted: boolean;
  /** What the word says. Passed rather than written here, since it is a sentence in the room's
   * language and this is a place for one to be put. */
  children: string;
}

/** The word that tells a player the round's enchanted card has reached them, wearing the glint
 * the rest of the round wears for them. It stands for its beat and then fades rather than being
 * dropped, and speaks for itself, since the word and the bar after it are one event. */
export function EnchantedArrival({ enchanted, children }: EnchantedArrivalProps) {
  const variant = useGlintVariant();
  // Whether the word has stood its beat and is on its way out, and whether it is off the
  // screen entirely. Both held here rather than in the caller, so the round can go on holding
  // `enchanted` for the whole window and the word still leaves on its own.
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!enchanted) return;
    setLeaving(false);
    setGone(false);
    playSound('Enchant');
    // One timer per arrival, cleared before any new one is set: two timers here are two words,
    // and the second arrives after the first has already gone.
    const leave = window.setTimeout(() => setLeaving(true), HoldMs);
    const away = window.setTimeout(() => setGone(true), HoldMs + FadeMs);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(away);
    };
  }, [enchanted]);
  // The fade is allowed to finish after the window closes: taking the word the instant the room
  // stops asking for it would cut off the very animation that says the notice is over.
  if ((!enchanted && !leaving) || gone) return null;
  return (
    <div class={styles.Root}>
      {!leaving && (
        <span class={`${styles.Backdrop} ${styles[`Glint${variant}`]}`} aria-hidden="true" />
      )}
      <span
        class={`${styles.Word} ${leaving ? styles.Leaving : styles.Showing} ${styles.Glinted} ${styles[`Glint${variant}`]}`}
        role="status"
      >
        {children}
      </span>
    </div>
  );
}
