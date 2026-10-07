import { ComponentChildren, Ref } from 'preact';
import { useRef } from 'preact/hooks';
import { useCountdownBeat } from './UseCountdownBeat';
import { useTimerFill } from './UseTimerFill';
import styles from './Timer.module.css';

export interface TimerProps {
  /** What the host says is left, counted on the host's clock, so every device in the room draws
   * the same block. */
  remainingMs: number;
  totalMs: number;
  /** How many seconds that is, as the room writes it. Passed in because a design component does
   * not know how a count is written in this room. */
  seconds: string;
  /** Whether the phase is nearly out. The threshold is the game's number, not this component's. */
  urgent?: boolean;
  /** How far to pitch the beat up, where the phase has started closing in. */
  beatSemitones?: number;
  /** Whose phase this is, in their own colour. Set only where the phase belongs to one player,
   * since a phase the whole room is in has nobody to be coloured after. */
  tint?: string;
  children?: ComponentChildren;
}

function shareLeft(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
}

/** The mark and the words, drawn twice: dark for the paper, and light where the fill has
 * reached. Keyed on the figure, so a new second remounts it and its turn starts again — an
 * animation restarted by a class or a re-render would not restart at all. */
function Content({
  seconds,
  className,
  hidden,
  clipRef,
  children,
}: {
  seconds: string;
  className: string;
  hidden?: boolean;
  clipRef?: Ref<HTMLDivElement>;
  children: ComponentChildren;
}) {
  return (
    <div class={className} aria-hidden={hidden} ref={clipRef}>
      <span class={styles.Seconds} key={seconds}>
        {seconds}
      </span>
      <span class={styles.Text}>{children}</span>
    </div>
  );
}

/** The phase draining away: a banner of its own, with the time left filling it from the left.
 * The words go from dark to light as the fill reaches them, which is why they are drawn twice
 * and the upper copy clipped to the fill rather than one copy tinted over two colours. */
export function Timer({
  remainingMs,
  totalMs,
  seconds,
  urgent = false,
  beatSemitones = 0,
  tint,
  children,
}: TimerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const pct = shareLeft(remainingMs, totalMs);

  useTimerFill(rootRef, barRef, inkRef, pct, tint);
  useCountdownBeat({ remainingMs, totalMs, seconds, beatSemitones });

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
      <Content seconds={seconds} className={styles.Content}>
        {children}
      </Content>
      <Content
        seconds={seconds}
        className={`${styles.Content} ${styles.Filled}`}
        clipRef={inkRef}
        hidden
      >
        {children}
      </Content>
    </div>
  );
}
