import { playSound } from '../../Sounds';
import { useSwayMotion } from '@/Design/Primitives';
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
 * note taken up rather than as another sound: the clip is already the bright one in the bank. */
const LikePitchSemitones = 12;

/** How many liked an answer, over the mark of the like itself. A button where it may be pressed
 * and a plain figure where it may not, so a player who cannot like their own answer is shown
 * the count and offered no control that does nothing. */
export function LikeBadge({ count, liked, label, onToggle }: LikeBadgeProps) {
  if (onToggle === undefined) {
    return <Figure count={count} liked={liked} label={label} />;
  }
  return <Pressable count={count} liked={liked} label={label} onToggle={onToggle} />;
}

/** The classes a badge is drawn as, so both of the elements above ask the same question the same
 * way rather than each keeping its own answer to it. */
function badgeClasses(count: number, liked: boolean, pressable: boolean): string {
  return [
    styles.Badge,
    styles.Swaying,
    count === 0 ? styles.Quiet : '',
    liked ? styles.Liked : '',
    pressable ? '' : styles.Spent,
  ]
    .filter(Boolean)
    .join(' ');
}

/** The mark behind the number. Ordered before the count because the count is the figure and this
 * is the ground it stands on; absolute, so that only decides the paint. */
function Mark() {
  return <span class={styles.Icon} aria-hidden="true" />;
}

/** The badge where the player may press it. */
function Pressable({
  count,
  liked,
  label,
  onToggle,
}: LikeBadgeProps & { onToggle: () => void }) {
  const motion = useSwayMotion<HTMLButtonElement>();
  return (
    <button
      type="button"
      class={badgeClasses(count, liked, true)}
      ref={motion}
      aria-pressed={liked}
      aria-label={label}
      onClick={() => {
        playSound('Pling', LikePitchSemitones);
        onToggle();
      }}
    >
      <Mark />
      <span class={styles.Count}>{count}</span>
    </button>
  );
}

/** The badge where they may not: the player's own answer, still showing what the room thought. */
function Figure({ count, liked, label }: LikeBadgeProps) {
  const motion = useSwayMotion<HTMLSpanElement>();
  return (
    <span class={badgeClasses(count, liked, false)} ref={motion} aria-label={label}>
      <Mark />
      <span class={styles.Count}>{count}</span>
    </span>
  );
}
