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
  children: ComponentChildren;
}

/** Words that go out with the phase, drawn twice: the dark copy whole, and the same words over
 * it clipped to what is left. The timer's own sweep with no bar behind it, so a sentence and
 * the bar counting the same phase down are one movement drawn twice. */
export function DrainingText({ remainingMs, totalMs, children }: DrainingTextProps) {
  const inkRef = useRef<HTMLSpanElement>(null);
  const pct = shareLeft(remainingMs, totalMs);
  useTimerFill(undefined, undefined, inkRef, pct);

  return (
    <span class={styles.Root}>
      <span class={styles.Gray}>{children}</span>
      <span class={styles.Ink} ref={inkRef} aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
