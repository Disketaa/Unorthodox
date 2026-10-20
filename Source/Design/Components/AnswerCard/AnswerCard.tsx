import { useRef } from 'preact/hooks';
import { useSwayMotion } from '@/Design/Primitives';
import { useGlintVariant } from '../Glint';
import { Authors } from './AnswerAuthors';
import { cardState } from './AnswerCardClasses';
import { Face } from './AnswerFace';
import { Score } from './AnswerScore';
import { LikeCorner } from './AnswerLikeCorner';
import { AnswerPress } from './AnswerPress';
import styles from './AnswerCard.module.css';
import { useDeclinedSound, useRevealedSound } from './UseCardSounds';
import { useCardPop } from './UseCardPop';
import type { AnswerCardProps } from './AnswerCardProps';

/** The mute, with the press remembered so the card's own crossing sound stands down for whoever
 * made it: the press already sounded it on the way in, and the board telling them again a beat
 * later is the same sound twice. */
function pressReject(pressedIt: { current: boolean }, onReject: (() => void) | undefined) {
  if (onReject === undefined) return undefined;
  return () => {
    pressedIt.current = true;
    onReject();
  };
}

/** The colour this card is paid in: its own writer's, since the figure on it is theirs. Left out
 * where there is no figure on the card — and on a card of somebody who wrote nothing, which
 * stands for the round they sat out. The tint follows the figure, not the moment it is paid. */
function payingColor(props: AnswerCardProps): string | null {
  if (props.paying !== true && props.paid !== true) return null;
  if (props.blank === true) return null;
  const writer = props.authors?.[0];
  return writer === undefined ? null : writer.color;
}

/** The card's writer's colour, for the badge in its corner to wear while the round is counting.
 * Handed over on every card the count walks, reached or not: a card the count has not come to
 * yet would still be wearing the reader's accent. Not on a blank, whose figures are nobody's. */
function tintFor(props: AnswerCardProps): { '--AnswerCard-Tint': string } | undefined {
  if (props.counting !== true || props.blank === true) return undefined;
  const writer = props.authors?.[0];
  return writer === undefined
    ? undefined
    : { '--AnswerCard-Tint': `var(--Color-Character-${writer.color})` };
}

/** Whether this card wears the round's shine: its writer was enchanted. The same rule the
 * enchanted theme card in the bank follows — a card the enchantment reached is shining from the
 * moment the room is shown it, through the round and into the count that pays it. */
function glinted(props: AnswerCardProps): boolean {
  return props.enchanted === true;
}

/** What is on the card's face: the answer as the substance while the room reads it, and the
 * figure's count in its place once the count reaches it — a card is either being read or being
 * paid and never both at once. */
function CardFace({
  props,
  named,
  onBeat,
}: {
  props: AnswerCardProps;
  named: number;
  onBeat: () => void;
}) {
  if (props.score !== undefined) {
    return (
      <Score
        score={props.score}
        paused={props.paused}
        run={props.run}
        elapsedMs={props.elapsedMs}
        onBeat={onBeat}
      />
    );
  }
  return <Face text={props.text} count={props.count} named={named} />;
}

interface CardSidesProps {
  props: AnswerCardProps;
  declined: boolean;
  revealed: boolean;
  pressedIt: { current: boolean };
  glintClass: string;
}

/** Everything hanging off the card's edges while it is read: the two controls, the writers in
 * the corner, and the shine the round lays over the card the count is on. */
function CardSides({ props, declined, revealed, pressedIt, glintClass }: CardSidesProps) {
  return (
    <>
      <AnswerPress
        onReject={pressReject(pressedIt, props.onReject)}
        onLike={props.onLike}
        declared={declined}
        revealed={revealed}
        muteLabel={props.muteLabel}
        likeLabel={props.likeLabel}
      />
      <Authors
        authors={props.authors}
        delays={props.writerDelays}
        shown={props.authorsShown !== false}
        ownPlayerId={props.ownPlayerId}
      />
      {glinted(props) && <span class={glintClass} aria-hidden="true" />}
      <LikeCorner
        blank={props.blank === true}
        voted={declined}
        revealed={revealed}
        likes={props.likes}
        liked={props.liked === true}
        likeLabel={props.likeLabel}
        onLike={props.onLike}
      />
    </>
  );
}

/** One answer on a panel: the answer as the substance, how many wrote it behind it, and the
 * grain the theme cards are printed on. A div rather than a button, since it carries two
 * controls and a button inside a button is not one. */
export function AnswerCard(props: AnswerCardProps) {
  const { declined, named, revealed, classes } = cardState(props);
  // Set by the press, spent by the sound. Without it the crossing belongs to the host alone.
  const pressedIt = useRef(false);
  useDeclinedSound(declined, pressedIt);
  useRevealedSound(revealed);
  // Rolled onto the card itself rather than onto anything inside it, so every value behind it
  // is this card's own and no two answers on a board lean the same way.
  const motion = useSwayMotion<HTMLDivElement>();
  const color = payingColor(props);
  const payingClass = color === null ? '' : styles[`Paying${color}`];
  // Rolled once per card, so a board of enchanted answers is a board of different shines rather
  // than one tile stamped nine times, and never rolls again underneath a card that is only reading.
  const glintClass = `${styles.Glint} ${styles[`Glint${useGlintVariant()}`]}`;
  const onBeat = useCardPop(motion);

  return (
    <div
      class={`${classes} ${payingClass} ${props.paid === true ? styles.Paid : ''}`}
      style={tintFor(props)}
      ref={motion}
    >
      <CardFace props={props} named={named} onBeat={onBeat} />
      <CardSides
        props={props}
        declined={declined}
        revealed={revealed}
        pressedIt={pressedIt}
        glintClass={glintClass}
      />
    </div>
  );
}
