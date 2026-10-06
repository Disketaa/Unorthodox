import { useRef, useEffect } from 'preact/hooks';
import styles from './Timer.module.css';

export interface TimerProps {
  /** What the host says is left, counted on the host's clock, so every device in the room draws
   * the same bar. */
  remainingMs: number;
  totalMs: number;
}

/** The phase draining away: a blue bar on a grey track, with the seconds beside it. The width is
 * written to the element rather than styled from render, because a value changing on every tick
 * is what the CSS transition is there to smooth. */
export function Timer({ remainingMs, totalMs }: TimerProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;

  useEffect(() => {
    const bar = barRef.current;
    if (bar) {
      bar.style.width = `${pct}%`;
    }
  }, [pct]);

  return (
    <div class={styles.Root}>
      <div class={styles.Track} role="progressbar" aria-valuenow={Math.ceil(pct)}>
        <div class={styles.Bar} ref={barRef} />
      </div>
      <span class={styles.Text}>{Math.ceil(remainingMs / 1000)}s</span>
    </div>
  );
}
