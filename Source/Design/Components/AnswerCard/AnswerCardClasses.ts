import type { AnswerCardProps } from './AnswerCardProps';
import styles from './AnswerCard.module.css';

/** The classes a card is drawn as, so the one place that answers "what state is it in" is one
 * expression rather than one branch per state at every use. */
function cardClasses(state: {
  declined: boolean;
  blank: boolean;
  turned: boolean;
  locked: boolean;
  live: boolean;
  takeback: boolean;
  own: boolean;
  moving: boolean;
}): string {
  const classes = [styles.Root, state.moving ? styles.Moving : styles.Still];
  if (state.declined) classes.push(styles.Voted);
  if (state.own) classes.push(styles.Own);
  if (state.blank) classes.push(styles.Blank);
  // The card is either something to press or a record, and which of those two is decided by
  // whether it is in the round rather than by whether this browser has a control for it: a host's
  // card is live the moment it comes up, and so is anybody else's.
  classes.push(state.live ? styles.Live : styles.Record);
  if (state.takeback) classes.push(styles.Takeback);
  if (state.locked) classes.push(styles.Locked);
  if (!state.turned) classes.push(styles.Unturned);
  return classes.join(' ');
}

/** Everything the card is doing right now, read off its props once. Live means pressable, which
 * means the card has finished saying what it has to say: before that the room is still reading
 * it, and a press that took one is a like cast on half an answer. */
export function cardState(props: AnswerCardProps) {
  const named = Math.min(props.landed ?? 0, props.count);
  const declined = props.voted === true && (props.count < 2 || named > 1);
  const revealed = props.revealed !== false;
  const blank = props.blank === true;
  const turned = props.turned !== false;
  const locked = props.locked === true;
  return {
    named,
    declined,
    revealed,
    classes: cardClasses({
      declined,
      blank,
      turned,
      locked: locked && declined,
      live: turned && !blank && !declined && revealed,
      takeback: declined && !locked,
      own: props.own === true,
      // A card being paid stands still. The sway is a transform, and a transformed element makes
      // itself the root of a stacking context — so a rocking card cannot be lifted above the dark
      // however high it is given. A figure being read does not need the room watching it breathe.
      moving: props.moving !== false && props.paying !== true,
    }),
  };
}
