import { playSound } from '../../Sounds';
import styles from './LikeBadge.module.css';

export interface LikeBadgeProps {
  /** How many players liked this answer. Shown whether or not the badge can be pressed: the
   * count is the room's, and a player is shown it on their own answer too. */
  count: number;
  /** Whether this player is one of the people who liked it, which is what draws it pressed. */
  liked: boolean;
  /** What the badge says out loud. The words belong to the layer above, which knows the language
   * the room is playing in and this one does not. */
  label: string;
  /** Liking the answer, or taking the like back. Left out where there is nothing to press — on
   * the player's own answer, which they may not like — and the badge is then a figure rather
   * than a control, drawn with the cursor that says so. */
  onToggle?: () => void;
}

/** How high the like sits above the clip it was recorded at. An octave, so it reads as the same
 * note taken up rather than as another sound: the clip is already the bright one in the bank,
 * and a like that wandered in pitch would be a second thing to notice rather than the press. */
const LikePitchSemitones = 12;

/** How many liked an answer, over the mark of the like itself, in the corner of the card it sits
 * in. A button where the player may press it and a plain figure where they may not, so a player
 * who cannot like their own answer is shown the count and offered no control that does nothing. */
export function LikeBadge({ count, liked, label, onToggle }: LikeBadgeProps) {
  const classes = [
    styles.Badge,
    count === 0 ? styles.Quiet : '',
    liked ? styles.Liked : '',
    onToggle === undefined ? styles.Spent : '',
  ]
    .filter(Boolean)
    .join(' ');
  // The mark first in the markup and the count last, because the count is the figure and the
  // mark is the ground it stands on. Absolute, so order only decides the paint: the count is
  // raised above it either way, and a screen reader reads the number before the shape.
  const figure = (
    <>
      <span class={styles.Icon} aria-hidden="true" />
      <span class={styles.Count}>{count}</span>
    </>
  );

  if (onToggle === undefined) {
    return (
      <span class={classes} aria-label={label}>
        {figure}
      </span>
    );
  }
  return (
    <button
      type="button"
      class={classes}
      aria-pressed={liked}
      aria-label={label}
      onClick={() => {
        playSound('Pling', LikePitchSemitones);
        onToggle();
      }}
    >
      {figure}
    </button>
  );
}
