import { ComponentChildren, Ref } from 'preact';
import { TimerContent } from './TimerContent';
import styles from './Timer.module.css';

interface TimerRootProps {
  rootRef: Ref<HTMLDivElement>;
  barRef: Ref<HTMLDivElement>;
  inkRef: Ref<HTMLDivElement>;
  pct: number;
  urgent: boolean;
  seconds: string;
  badge?: ComponentChildren;
  children?: ComponentChildren;
}

export function TimerRoot({
  rootRef,
  barRef,
  inkRef,
  pct,
  urgent,
  seconds,
  badge,
  children,
}: TimerRootProps) {
  return (
    <div
      ref={rootRef}
      class={`${styles.Root} ${urgent ? styles.Urgent : ''}`}
      role="progressbar"
      aria-valuenow={Math.ceil(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div class={styles.Bar} ref={barRef} aria-hidden="true" />
      <TimerContent seconds={seconds} badge={badge} className={styles.Content}>
        {children}
      </TimerContent>
      <TimerContent
        seconds={seconds}
        badge={badge}
        className={`${styles.Content} ${styles.Filled}`}
        clipRef={inkRef}
        hidden
      >
        {children}
      </TimerContent>
    </div>
  );
}
