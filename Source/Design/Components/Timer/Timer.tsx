import { useRef, useEffect } from "preact/hooks";
import styles from "./Timer.module.css";

export interface TimerProps {
  remainingMs: number;
  totalMs: number;
}

export function Timer({ remainingMs, totalMs }: TimerProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = totalMs > 0 ? Math.max(0, (remainingMs / totalMs) * 100) : 0;
  const isUrgent = pct < 25;

  useEffect(() => {
    const bar = barRef.current;
    if (bar) {
      bar.style.width = `${pct}%`;
    }
  }, [pct]);

  return (
    <div class={`${styles.Root} ${isUrgent ? styles.Urgent : ""}`}>
      <div class={styles.Bar} ref={barRef} />
      <span class={styles.Text}>{Math.ceil(remainingMs / 1000)}s</span>
    </div>
  );
}
