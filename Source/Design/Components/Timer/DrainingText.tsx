import { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useTimerFill } from './UseTimerFill';
import styles from './DrainingText.module.css';

/** How much of a phase is left as a share of the whole, clamped to the hundred a clip needs. */
export function shareLeft(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
}

export interface DrainingTextProps {
  remainingMs: number;
  totalMs: number;
  /** Whether the phase is nearly out, which turns the words red. The threshold is the game's
   * number, not this component's, the same as it is for the bar this drains alongside. */
  urgent?: boolean;
  children: ComponentChildren;
}

/** Words that go out with the phase, drawn twice: the dark copy whole, and the same words over
 * it clipped to what is left. The timer's own sweep with no bar behind it, so a sentence and
 * the bar counting the same phase down are one movement drawn twice. */
export function DrainingText({
  remainingMs,
  totalMs,
  urgent = false,
  children,
}: DrainingTextProps) {
  const inkRef = useRef<HTMLSpanElement>(null);
  const pct = shareLeft(remainingMs, totalMs);
  useTimerFill(undefined, undefined, inkRef, pct);

  return (
    <span class={urgent ? `${styles.Root} ${styles.Urgent}` : styles.Root}>
      <span class={styles.Gray}>{children}</span>
      <span class={styles.Ink} ref={inkRef} aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
