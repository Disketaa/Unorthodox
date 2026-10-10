/** The room announcing that it has moved on: the mark standing in the middle of it while the
 * room's yellow comes up and goes back down. A layer rather than a screen: what it covers is
 * the phase the room is leaving, and what it hands back is the phase it has arrived at. */
import { useSwayMotion } from '@/Design/Primitives';
import styles from './PhaseSplash.module.css';

/** How long the splash runs, in milliseconds. Held here rather than in a token alone because
 * something has to know when to take the layer away and a token is not readable from script:
 * `Tests/PhaseSplash.test.ts` holds the two in step. Not a phase length — nothing waits on it. */
export const PhaseSplashMs = 750;

/** The stretch of the movement during which the yellow covers the whole window, as shares of
 * `PhaseSplashMs`. The room swaps its screen inside it, so a change of phase happens behind
 * solid colour. `Tests/PhaseSplash.test.ts` holds both against the stylesheet. */
export const PhaseSplashCovered = { from: 0.16, to: 0.85 } as const;

export interface PhaseSplashProps {
  /** What the mark says, for anyone who cannot see it. */
  label: string;
}

/** The mark in the room's yellow, swaying as the wordmark does. It takes the pointer, since a
 * room between two phases has nothing anybody can press: the answers of the round are already
 * in, and the screen under this one is about to be replaced. */
export function PhaseSplash({ label }: PhaseSplashProps) {
  const motionRef = useSwayMotion<HTMLDivElement>();
  return (
    <div class={styles.Root} role="status">
      <div class={styles.Disc} />
      <div class={styles.Mark} ref={motionRef} role="img" aria-label={label} />
    </div>
  );
}
