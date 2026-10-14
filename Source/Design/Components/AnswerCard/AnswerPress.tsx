import { playSound } from '../../Sounds';
import { LikePitchSemitones } from '../LikeBadge';
import styles from './AnswerCard.module.css';

/** The card's own two presses. Both wait for the same beat the like badge does and on the same
 * flag rather than a rule of their own: a host should not be able to turn an answer down while
 * the room is still reading it. */
export function AnswerPress(props: {
  onReject: (() => void) | undefined;
  onLike: (() => void) | undefined;
  declared: boolean;
  revealed: boolean;
  muteLabel: string | undefined;
  likeLabel: string | undefined;
}) {
  if (props.onReject !== undefined && props.revealed) {
    return <Mute {...props} onReject={props.onReject} />;
  }
  // Pointer only, and gone the moment the card is drawn as declared: a card that took the press and
  // did nothing would be the one control in the room with nothing behind it.
  if (props.onLike !== undefined && props.revealed && !props.declared) {
    return <CardLike {...props} onLike={props.onLike} />;
  }
  return null;
}

type Press = Parameters<typeof AnswerPress>[0];

function Mute({ declared, muteLabel, onReject }: Press & { onReject: () => void }) {
  return (
    <button
      type="button"
      class={styles.Whole}
      aria-pressed={declared}
      aria-label={muteLabel}
      onClick={() => {
        // With the finger going down, not with the board having caught up: the sound belongs to the
        // press, struck on the way in and popped on the way back out.
        playSound(declared ? 'Pop' : 'Break');
        onReject();
      }}
    />
  );
}

/** A control the size of a card is the one thing pressable in a room where people are standing
 * up, which is why everybody who is not the host likes through it rather than through the
 * badge. */
function CardLike({ likeLabel, onLike }: Press & { onLike: () => void }) {
  return (
    <button
      type="button"
      class={styles.Whole}
      aria-label={likeLabel}
      aria-hidden="true"
      tabIndex={-1}
      onClick={() => {
        playSound('Pling', LikePitchSemitones);
        onLike();
      }}
    />
  );
}
