import { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useFittedText } from './UseFittedText';
import styles from './AnswerCard.module.css';

export interface AnswerCardProps {
  /** The answer, as everybody who wrote this wrote it. */
  text: string;
  /** How many players wrote it. Drawn behind the answer as the card's own figure, and left off
   * entirely when it is one, since a single writer is the common case and a figure of one
   * behind every unique answer is a number that says nothing. */
  count: number;
  /** Whether the host has muted this answer, which the whole room is shown. */
  voted?: boolean;
  /** Whether the player wrote nothing at all, so this card stands for a round they sat out. Held
   * back to the same quietness as a theme card with no rounds left in it. */
  blank?: boolean;
  /** Muting the answer, and taking the mute back. Only the host is given one, so on every other
   * screen the card is a record of the round rather than a control in it. */
  onReject?: () => void;
  /** Whether the room has got to this answer yet. A card the room has not read is not on the
   * board: the room is shown one answer at a time, and a board already drawn is a board nobody
   * watched being wrong about. On by default, which is every use but the round's own. */
  turned?: boolean;
}

/** The classes a card is drawn as, so the one place that answers "what state is it in" is one
 * expression rather than one branch per state at every use. */
function cardClasses(
  voted: boolean,
  votable: boolean,
  blank: boolean,
  turned: boolean
): string {
  const classes = [styles.Root];
  if (voted) classes.push(styles.Voted);
  if (blank) classes.push(styles.Blank);
  if (!votable) classes.push(styles.Record);
  if (!turned) classes.push(styles.Unturned);
  return classes.join(' ');
}

/** What is written on the card: the answer, fitted to the box it is given. The panel and the
 * grain are decoration on a surface the card paints itself, so they are spans rather than
 * layout elements: a `Card` here would fight the button's own box. */
function Face({ text, count }: Pick<AnswerCardProps, 'text' | 'count'>): ComponentChildren {
  return (
    <>
      <span class={styles.Panel} aria-hidden="true" />
      {count > 1 && (
        <span class={styles.Mark} aria-hidden="true">
          {count}
        </span>
      )}
      <span class={styles.Noise} aria-hidden="true" />
      <FittedAnswer text={text} />
    </>
  );
}

/** The answer itself, which measures itself into the card rather than being cut off at its edge.
 * Its own element inside the centring room rather than text straight into it: as bare text it
 * is sized to its longest line, and a word wider than the card then cannot wrap. */
function FittedAnswer({ text }: { text: string }) {
  const answer = useRef<HTMLSpanElement>(null);
  useFittedText(answer, text);
  return (
    <span class={styles.Room}>
      <span class={styles.Answer} ref={answer}>
        {text}
      </span>
    </span>
  );
}

/** One answer on a panel: the answer as the substance, how many wrote it behind it, and the
 * grain the theme cards are printed on. A button where there is something to press, a plain
 * element where there is not. */
export function AnswerCard({
  text,
  count,
  voted = false,
  blank = false,
  turned = true,
  onReject,
}: AnswerCardProps) {
  const classes = cardClasses(voted, onReject !== undefined, blank, turned);
  if (onReject === undefined) {
    return (
      <div class={classes}>
        <Face text={text} count={count} />
      </div>
    );
  }
  return (
    <button type="button" class={classes} aria-pressed={voted} onClick={onReject}>
      <Face text={text} count={count} />
    </button>
  );
}
