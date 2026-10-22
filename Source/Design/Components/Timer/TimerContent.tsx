import { ComponentChildren, Ref } from 'preact';
import styles from './Timer.module.css';

export function TimerContent({
  seconds,
  badge,
  className,
  hidden,
  clipRef,
  children,
}: {
  seconds: string;
  badge?: ComponentChildren;
  className: string;
  hidden?: boolean;
  clipRef?: Ref<HTMLDivElement>;
  children: ComponentChildren;
}) {
  return (
    <div class={className} aria-hidden={hidden} ref={clipRef}>
      {badge !== undefined ? (
        <span class={styles.Seconds} key="badge">
          {badge}
        </span>
      ) : seconds !== '' ? (
        <span class={styles.Seconds} key={seconds}>
          {seconds}
        </span>
      ) : null}
      <span class={styles.Text}>{children}</span>
    </div>
  );
}
