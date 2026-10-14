import { useState } from 'preact/hooks';
import { Pop } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { LikeBadge, LikePitchSemitones } from '../LikeBadge';
import type { AnswerCardProps } from './AnswerCardProps';
import styles from './AnswerCard.module.css';

/** The like badge in the corner, or nothing at all on a blank or a card the host has muted. A
 * blank is nobody having written and a muted card is out of the round, so neither has anything
 * a like could be. */
export function LikeCorner({
  blank,
  voted,
  revealed,
  likes,
  liked,
  likeLabel,
  onLike,
}: Pick<
  AnswerCardProps,
  'blank' | 'voted' | 'revealed' | 'likes' | 'liked' | 'likeLabel' | 'onLike'
>) {
  // A press counter rather than the liked flag, so the pop runs on the press and not on the state
  // arriving: the flag only flips once the host has answered, a beat after the finger.
  const [pressed, setPressed] = useState(0);
  if (blank || voted || !revealed) {
    return null;
  }
  // The corner rather than the badge is held back, so the figure, the mark and the outline round it
  // all fade as one thing. Only the cursor lives on the badge, which has to say it in place.
  const spent = onLike === undefined;
  const toggle =
    onLike === undefined
      ? undefined
      : () => {
          setPressed((count) => count + 1);
          playSound('Pling', LikePitchSemitones);
          onLike();
        };
  return (
    <span class={spent ? `${styles.Corner} ${styles.CornerSpent}` : styles.Corner}>
      {/* Keyed on the count of presses, so a new one is a new element and the pop runs from the
       * start. Composed rather than written: the sway underneath is also a CSS animation, and the
       * pop uses individual scale and rotate so the two do not overwrite one another. */}
      <Pop trigger={pressed}>
        <LikeBadge
          count={likes ?? 0}
          liked={liked ?? false}
          label={likeLabel ?? ''}
          onToggle={toggle}
        />
      </Pop>
    </span>
  );
}
