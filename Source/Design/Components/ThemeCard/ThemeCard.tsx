import { ThemeId, themeAccent } from '@/Core';
import { useCallback } from 'preact/hooks';
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
  /** Whether the card blinks. On by default for a bank of them being offered, where the row is
   * the thing being drawn to; off wherever the card is a record of something already chosen. */
  blink?: boolean;
  /** Whether this is the card the room settled on. It holds the accent the pointer gave it,
   * which is what leaves one thing on screen wearing a colour while the rest of the bank fades
   * out. */
  chosen?: boolean;
  /** Whether the room's own roll is on this card, which is drawn exactly as a pointer on it
   * would draw it — same wash, same opened name, same mark. Anything less reads as the room
   * glancing at the bank rather than the room looking at it. */
  swept?: boolean;
  /** Whether the card has stopped taking presses, because the room has already answered. Every
   * card including the chosen one: the answer is in. */
  locked?: boolean;
  /** Whether the card belongs to another player's turn. Held back and given the pointer, rather
   * than `locked`, which takes the hover with it: the bank is still being read while it waits. */
  waiting?: boolean;
}

/** The theme's own first letter, as the card's substance. One letter, not an abbreviation: the
 * name is right there and is the thing being read, so this is here because a card with a name
 * and nothing else is a label. */
function initialOf(name: string) {
  return [...name.trim()][0] ?? '';
}

/** The card's own place in the turn of the blink, as places from the first, so the wave is one
 * value per card rather than six cards handed six delays. */
function writeTheme(node: HTMLElement, theme: ThemeId, index: number) {
  const accent = themeAccent(theme);
  node.style.setProperty('--ThemeCard-Wash', accent.wash);
  node.style.setProperty('--ThemeCard-Ink', accent.ink);
  node.style.setProperty('--ThemeCard-Tint', accent.tint);
  node.style.setProperty('--Blink-Offset', String(index - 1));
}

/** What the card is drawn as. The blink goes with the chosen state, since a card the room has
 * answered is no longer one of a row being offered. */
function cardClasses(
  moving: boolean,
  blink: boolean,
  chosen: boolean,
  swept: boolean,
  waiting: boolean,
  spentOut: boolean
): string {
  const classes = [styles.Root, moving ? styles.Moving : styles.Still];
  if (blink && !chosen) classes.push(styles.Blink);
  if (chosen) classes.push(styles.Chosen);
  if (swept) classes.push(styles.Swept);
  if (waiting || spentOut) classes.push(styles.Waiting);
  if (spentOut) classes.push(styles.SpentOut);
  return classes.join(' ');
}

/** The ref the card is written to, with the theme on it before the first paint: an effect runs
 * after it, which showed the card for a frame in the fallbacks and then recoloured it. */
function useCardRef(
  motion: { current: HTMLButtonElement | null },
  theme: ThemeId,
  index: number
) {
  return useCallback(
    (node: HTMLButtonElement | null) => {
      motion.current = node;
      if (node !== null) {
        writeTheme(node, theme, index);
      }
    },
    [motion, theme, index]
  );
}

/** The card's face, as spans rather than layout elements: the card paints its own surface, so
 * the face is decoration on it and a Stack here would fight the button's own box. */
function CardFace({
  name,
  index,
  rounds,
  spent,
}: Pick<ThemeCardProps, 'name' | 'index' | 'rounds' | 'spent'>) {
  return (
    <>
      <span class={styles.Initial} aria-hidden="true">
        {initialOf(name ?? '')}
      </span>
      <span class={styles.Panel}>
        <span class={styles.Mark} aria-hidden="true">
          {index}
        </span>
      </span>
      <span class={styles.Noise} aria-hidden="true" />
      <span class={styles.Name}>{name}</span>
      <RoundMeter rounds={rounds ?? 10} spent={spent ?? 0} />
    </>
  );
}

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
  blink = true,
  chosen = false,
  swept = false,
  locked = false,
  waiting = false,
}: ThemeCardProps) {
  const motion = useSwayMotion<HTMLButtonElement>();
  // A theme the room has already spent every round it had. Read off the counts rather than taken
  // as a prop, because the card is what knows its own rounds and its own count of them.
  const spentOut = spent >= rounds;

  const ref = useCardRef(motion, theme, index);

  return (
    <button
      type="button"
      ref={ref}
      class={cardClasses(moving, blink, chosen, swept, waiting, spentOut)}
      disabled={locked}
      // Announced rather than disabled: the card is on screen and readable, so a screen reader is
      // told it cannot be pressed instead of being left to find a button that does nothing.
      aria-disabled={waiting || spentOut || swept || undefined}
      onClick={() => {
        if (waiting || spentOut || swept) {
          return;
        }
        playSound('Pop');
        onPick?.(theme);
      }}
    >
      <CardFace name={name} index={index} rounds={rounds} spent={spent} />
    </button>
  );
}
