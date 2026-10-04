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
  /**
   * How many rounds this theme is played for.
   *
   * On the card rather than read from the game rules, because a card is also
   * drawn in the gallery and by anything that wants one card on its own, and a
   * component that reached into the game's configuration to count its own ticks
   * would not be usable anywhere else.
   */
  rounds?: number;
  /**
   * How many of the theme's rounds have been played.
   *
   * A count of what has gone rather than an index of what is next, because the
   * row empties from the right: after one round it is nine coloured and one
   * grey at the right end. Left out it is nothing, which is a full bar.
   */
  spent?: number;
  /**
   * Where this card sits in the bank, counted from one.
   *
   * The number on the card, and it is the card's place in the row rather than
   * the theme's place in the catalogue: the six in front of a player are
   * numbered one to six whatever they are, and a card numbered out of the
   * catalogue would read as a fact about the theme that the room has not agreed
   * on.
   */
  index?: number;
  /** Asking for this theme. Nothing is decided yet, so nothing acts on it yet. */
  onPick?: (theme: ThemeId) => void;
  /** Whether the card idles. On by default, since a still card is the odd one out; off for a gallery row or anything already moving. */
  moving?: boolean;
}

/**
 * The theme's own first letter, as the card's substance.
 *
 * One letter rather than a word, and it is not there to abbreviate the name —
 * the name is right there under it and is the thing being read. It is there
 * because a card with a name on it and nothing else is a label: a big letter in
 * the theme's own colour says what the panel is about the way a dictionary's
 * do, and it is what makes six cards six themes rather than six labels.
 *
 * Taken from the name as the player sees it rather than from the catalogue, so
 * it follows the language: a theme whose name is written in Russian on this
 * device opens with the Russian letter, and a card whose name began with a
 * combining mark would open on its base character rather than on half a glyph.
 */
function initialOf(name: string) {
  return [...name.trim()][0] ?? '';
}

/** The custom properties the stylesheet reads the theme's own accent out of. */
const Properties = {
  wash: '--ThemeCard-Wash',
  ink: '--ThemeCard-Ink',
  tint: '--ThemeCard-Tint',
} as const;

/**
 * One theme, as a card with its name on it.
 *
 * A button rather than a `Card` inside one, and the reason is the hover. `Card`
 * paints an opaque surface of its own, so a wash on the button underneath it
 * would never be seen, and the card's own API is closed — it takes no
 * `className` for the wash to be written on. The frame is therefore drawn here
 * from the same tokens `Card` uses, which is the one place in the design system
 * where a component's surface is re-declared rather than borrowed.
 *
 * The card is a button because a card you can point at has to be one: a `div`
 * with a hover on it is a control the browser does not know about, cannot
 * focus, and cannot announce. Nothing is done with the press yet — the rule for
 * who chooses a theme is still being decided — but the card answers the pointer
 * with the same pop as every other control in the game, so pressing it is not a
 * dead gesture.
 *
 * The card carries one large mark behind the name: where this card sits in the
 * bank, cut off by the frame. It is there so the panel is about something
 * rather than only labelled — a card with a name on it and nothing else is a
 * label, and the bank is being held out at the player rather than listed. The
 * same figure is on both of the devices in the room, because it comes from the
 * card's place in the row and not from either of them.
 *
 * The mark is `aria-hidden`: the theme's name is what is announced, and a
 * number in front of it would be read out as part of the name. The grain is
 * hidden too, for the same reason and because it carries nothing at all.
 *
 * The wash and the ink are written onto the card's own node rather than passed
 * in, so the theme's colour is the theme's business and not a prop every caller
 * has to remember: a caller that passed the colour could pass the wrong one,
 * and two cards of one bank wearing two colours would be a mistake nothing
 * could see. The values come from `Core`, where the eight tints live and where
 * they are already measured for contrast.
 *
 * The card rocks on the shared `Sway`, composed rather than written out, so the
 * six cards, the characters and the game's name are one movement and not three
 * that happen to agree. A bank of six still cards is a menu; six that shift
 * their weight is a hand being held out.
 */
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
