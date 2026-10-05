import { ThemeId, themeAccent } from '@/Core';
import { useEffect } from 'preact/hooks';
import { useSwayMotion } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { RoundMeter } from '../RoundMeter';
import styles from './ThemeCard.module.css';

export interface ThemeCardProps {
  theme: ThemeId;
  /** The theme's name in this player's language. */
  name: string;
  /** How many rounds this theme is played for. On the card rather than read from the game rules,
   * because a component that reached into the game's configuration to count its own ticks would
   * not be usable anywhere else. */
  rounds?: number;
  /** How many of the theme's rounds have been played. A count of what has gone rather than an
   * index of what is next, because the row empties from the right. Left out it is nothing,
   * which is a full bar. */
  spent?: number;
  /** Where this card sits in the bank, counted from one. The card's place in the row rather than
   * the theme's place in the catalogue: the six in front of a player are numbered one to six
   * whatever they are. */
  index?: number;
  /** Asking for this theme. Nothing is decided yet, so nothing acts on it yet. */
  onPick?: (theme: ThemeId) => void;
  /** Whether the card idles. On by default, since a still card is the odd one out; off for a
   * gallery row or anything already moving. */
  moving?: boolean;
}

/** The theme's own first letter, as the card's substance. One letter, not an abbreviation: the
 * name is right there and is the thing being read, so this is here because a card with a name
 * and nothing else is a label. */
function initialOf(name: string) {
  return [...name.trim()][0] ?? '';
}

/** The custom properties the stylesheet reads the theme's own accent out of. */
const Properties = {
  wash: '--ThemeCard-Wash',
  ink: '--ThemeCard-Ink',
  tint: '--ThemeCard-Tint',
} as const;

/** One theme, as a card with its name on it. A button rather than a `Card` inside one, since
 * `Card` paints an opaque surface and takes no `className`, so a wash underneath would never be
 * seen. */
export function ThemeCard({
  theme,
  name,
  index = 1,
  rounds = 10,
  spent = 0,
  onPick,
  moving = true,
}: ThemeCardProps) {
  const motion = useSwayMotion<HTMLButtonElement>();

  useEffect(() => {
    const node = motion.current;
    if (node === null) {
      return;
    }
    const accent = themeAccent(theme);
    node.style.setProperty(Properties.wash, accent.wash);
    node.style.setProperty(Properties.ink, accent.ink);
    node.style.setProperty(Properties.tint, accent.tint);
  }, [theme, motion]);

  const classes = `${styles.Root} ${moving ? styles.Moving : styles.Still}`;

  return (
    <button
      type="button"
      ref={motion}
      class={classes}
      onClick={() => {
        playSound('Pop');
        onPick?.(theme);
      }}
    >
      <span class={styles.Initial} aria-hidden="true">{initialOf(name)}</span>
      <span class={styles.Panel}><span class={styles.Mark} aria-hidden="true">{index}</span></span>
      <span class={styles.Noise} aria-hidden="true" />
      <span class={styles.Name}>{name}</span>
      <RoundMeter rounds={rounds} spent={spent} />
    </button>
  );
}
