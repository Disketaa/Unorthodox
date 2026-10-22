import { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useCountdownBeat } from './UseCountdownBeat';
import { shareLeft } from './DrainingText';
import { useTimerFill } from './UseTimerFill';
import { TimerRoot } from './TimerRoot';

export interface TimerProps {
  /** What the host says is left, counted on the host's clock, so every device in the room draws
   * the same block. */
  remainingMs: number;
  totalMs: number;
  /** How many seconds that is, as the room writes it. Passed in because a design component does
   * not know how a count is written in this room. */
  seconds: string;
  /** The figure at the head of the line instead of the seconds: the winner's character where the
   * phase names a player rather than counting down. */
  badge?: ComponentChildren;
  /** Whether the phase is nearly out, which reddens the fill. The threshold is the game's
   * number, not this component's. */
  urgent?: boolean;
  /** How far to pitch the beat up, where the phase has started closing in. */
  beatSemitones?: number;
  /** Whose phase this is, in their own colour. Set only where the phase belongs to one player,
   * since a phase the whole room is in has nobody to be coloured after. */
  tint?: string;
  children?: ComponentChildren;
}

/** The phase draining away. */
export function Timer({
  remainingMs,
  totalMs,
  seconds,
  badge,
  urgent = false,
  beatSemitones = 0,
  tint,
  children,
}: TimerProps) {
  const [rootRef, barRef, inkRef] = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const pct = shareLeft(remainingMs, totalMs);
  useTimerFill(rootRef, barRef, inkRef, pct, tint);
  useCountdownBeat({ remainingMs, totalMs, seconds, beatSemitones });

  return (
    <TimerRoot
      rootRef={rootRef}
      barRef={barRef}
      inkRef={inkRef}
      pct={pct}
      urgent={urgent}
      seconds={seconds}
      badge={badge}
    >
      {children}
    </TimerRoot>
  );
}
