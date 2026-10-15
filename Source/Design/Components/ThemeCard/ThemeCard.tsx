import { ThemeId, ThemeModifierId, themeAccent } from '@/Core';
import { useCallback } from 'preact/hooks';
import { useSwayMotion } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { useGlintVariant } from '../Glint';
import { CardFace } from './ThemeCardFace';
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
  /** What the round has put on this card on top of its theme. Off for every card in a bank the
   * round left alone, which is a real answer rather than a bank waiting to be told. */
  modifiers?: readonly ThemeModifierId[];
  /** The multiplier this card wears, from the room's roll. A card with none is plain: the corner
   * is left empty rather than showing a number that belongs to no round. */
  mult?: number;
  /** What the card's effect is called, in the player's language. Passed in rather than read from
   * the content here, since a card is drawn in Design and the words are the content's. */
  effectLabel?: string;
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

/** The card's own place in the turn of the blink, as places from the first, so the wave is one
 * value per card rather than six cards handed six delays. */
function writeTheme(node: HTMLElement | null | undefined, theme: ThemeId, index: number) {
  if (node == null) return;
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
      if (node != null) {
        writeTheme(node, theme, index);
      }
    },
    [motion, theme, index]
  );
}

/** One theme, as a card with its name on it. A button, since a Card paints an opaque surface. */
export function ThemeCard(props: ThemeCardProps) {
  const { theme, index = 1, spent = 0, rounds = 10 } = props;
  const motion = useSwayMotion<HTMLButtonElement>();
  // A theme the room has spent every round it had, read off the card's own counts.
  const spentOut = spent >= rounds;
  const ref = useCardRef(motion, theme, index);

  return (
    <ThemeCardButton
      {...props}
      index={index}
      spent={spent}
      rounds={rounds}
      buttonRef={ref}
      spentOut={spentOut}
    />
  );
}

/** Pressing a card the room is still offering. A card that is waiting, spent or already swept
 * takes the press and does nothing with it, since the room is not asking about it. */
function pressCard(
  theme: ThemeId,
  onPick: ((theme: ThemeId) => void) | undefined,
  blocked: boolean
) {
  if (blocked) return;
  playSound('Pop');
  onPick?.(theme);
}

/** The card's own button, split out to keep the component above under the line limit. */
function ThemeCardButton({
  theme,
  modifiers,
  effectLabel,
  chosen = false,
  swept = false,
  locked = false,
  waiting = false,
  moving = true,
  blink = true,
  onPick,
  buttonRef,
  spentOut,
  ...face
}: ThemeCardProps & {
  buttonRef: (node: HTMLButtonElement | null) => void;
  spentOut: boolean;
}) {
  const enchanted = !spentOut && modifiers?.includes('Enchanted') === true;
  const variant = useGlintVariant();
  const glintClass = `${styles.Glint} ${styles[`Glint${variant}`]}`;
  return (
    <button
      type="button"
      ref={buttonRef}
      class={cardClasses(moving, blink, chosen, swept, waiting, spentOut)}
      disabled={locked}
      aria-disabled={waiting || spentOut || swept || undefined}
      onClick={() => pressCard(theme, onPick, waiting || spentOut || swept)}
    >
      <CardFace {...face} />
      {enchanted && <span class={glintClass} aria-hidden="true" />}
      {effectLabel !== undefined && <span class={styles.EffectLabel}>{effectLabel}</span>}
    </button>
  );
}
