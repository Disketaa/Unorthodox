import { useRef } from 'preact/hooks';
import { useSwayMotion } from '@/Design/Primitives';
import { Authors } from './AnswerAuthors';
import { cardState } from './AnswerCardClasses';
import { Face } from './AnswerFace';
import { LikeCorner } from './AnswerLikeCorner';
import { AnswerPress } from './AnswerPress';
import { useDeclinedSound, useRevealedSound } from './UseCardSounds';
import type { AnswerCardProps } from './AnswerCardProps';

/** One answer on a panel: the answer as the substance, how many wrote it behind it, and the
 * grain the theme cards are printed on. A div rather than a button, since it now carries two
 * controls and a button inside a button is not one. */
export function AnswerCard(props: AnswerCardProps) {
  const { declined, named, revealed, classes } = cardState(props);
  // Set by the press, spent by the sound. Without it the crossing belongs to the host alone, which
  // is the one room of players who were all meant to be there.
  const pressedIt = useRef(false);
  useDeclinedSound(declined, pressedIt.current);
  useRevealedSound(revealed);
  // Rolled onto the card itself rather than onto anything inside it, so every value behind it is
  // this card's own and no two answers on a board lean the same way.
  const motion = useSwayMotion<HTMLDivElement>();
  return (
    <div class={classes} ref={motion}>
      <Face text={props.text} count={props.count} named={named} />
      <AnswerPress
        onReject={props.onReject}
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
      <LikeCorner
        blank={props.blank === true}
        voted={declined}
        revealed={revealed}
        likes={props.likes}
        liked={props.liked === true}
        likeLabel={props.likeLabel}
        onLike={props.onLike}
      />
    </div>
  );
}
