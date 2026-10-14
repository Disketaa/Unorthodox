import { ComponentChildren } from 'preact';
import { useCallback, useRef } from 'preact/hooks';
import styles from './Pop.module.css';

export interface PopProps {
  /** What counts as "the same reaction". Change it to replay the pop. The element is keyed on
   * this, so a new value is a new element and the animation runs from the start. Pass the thing
   * that just changed, not a counter, and leave it undefined to never react. */
  trigger: string | number | undefined;
  /** Its place in a row, so a row of reactions ripples instead of firing in unison. */
  index?: number;
  /** How far apart two places in the row are, as a finished length. Left out, it is the token
   * the whole game shares. Raised it for a row that is far apart or long: a wave that closes
   * inside the pop's own duration is not a wave, it is one movement with different starts. */
  stagger?: string;
  /** How long this one reaction waits, as a finished length, rather than a place in a row. For a
   * reaction whose timing is the point: the second of two faces on an answer is held back on
   * purpose, and no share of a row's beat says that. */
  delay?: string;
  /** How tall the reaction starts, as a share of its own height. The whole game squashes from
   * over-tall down to true, which is what a character already on the screen does when it reacts.
   * A reaction that is also an arrival starts at nothing and grows: zero, so the character is
   * briefly invisible and the room watches it come up rather than watching it wobble. */
  squash?: string;
  /** Fires after this reaction's wait, so a row of arrivals can each make their own sound. The
   * wait is the same one the stylesheet uses — parsed off the delay rather than passed twice. */
  onStart?: () => void;
  children?: ComponentChildren;
}

/** How long a wait is, in milliseconds, from the finished length the caller passed. The caller
 * hands over a string for the stylesheet; this reads it back as a number for a timer. */
function delayMsOf(delay: string | undefined): number {
  if (delay === undefined) {
    return 0;
  }
  const plain = /^(\d+)ms$/.exec(delay);
  if (plain !== null) {
    return parseInt(plain[1], 10);
  }
  const calc = /^calc\((\d+)ms \+ (\d+) \* (\d+)ms\)$/.exec(delay);
  if (calc !== null) {
    return parseInt(calc[1], 10) + parseInt(calc[2], 10) * parseInt(calc[3], 10);
  }
  return 0;
}

/** Runs its child through the squash-and-stretch pop, replaying whenever the trigger changes.
 * Uses the individual `scale`, `rotate` and `translate` properties, which compose with an
 * ancestor's `transform`, so a pop plays over an idle sway without either replacing the other. */
export function Pop({ trigger, index, stagger, delay, squash, onStart, children }: PopProps) {
  // The sound callback is read through a ref rather than closed over. A caller cannot hold a
  // callback still across renders - an inline arrow inside a map is a new function every time -
  // and this ref callback runs again whenever its identity changes, which would put a fresh timer
  // on the node, which would fire the caller's callback, which would render, and around again.
  // That loop freezes the page, so what re-runs the timing must not be who is doing the sounding.
  const start = useRef(onStart);
  start.current = onStart;

  // The one timer this pop is holding, cleared before any new one is set. Two timers on one node
  // are two arrivals for one badge, and the second counts again after the first already has.
  const pending = useRef(0);

  // Set from a ref callback rather than an effect: an effect runs after the first paint, by which
  // point the animation has begun, and a property changed mid-animation is too late for the delay. A
  // finished delay is the row narrowed to one place, so the wait is the length itself.
  const setTiming = useCallback(
    (node: HTMLSpanElement | null) => {
      // Ahead of the null check, so a pop going away takes its timer with it: a sound firing after
      // its badge is gone is a sound with nothing on the screen behind it.
      window.clearTimeout(pending.current);
      pending.current = 0;
      if (node === null) {
        return;
      }
      node.style.setProperty('--Pop-Index', String(delay === undefined ? (index ?? 0) : 1));
      const beat = delay ?? stagger;
      if (beat !== undefined) {
        node.style.setProperty('--Pop-Stagger', beat);
      }
      if (squash !== undefined) {
        node.style.setProperty('--Pop-Squash', squash);
      }
      // A sound for this one, on the beat it starts rather than when it is mounted: the pop waits
      // before it moves, and the sound belongs to the movement. Read off the same delay the
      // stylesheet uses, so the two cannot drift.
      if (start.current !== undefined) {
        const wait = delayMsOf(delay ?? stagger);
        if (wait === 0) {
          start.current();
        } else {
          pending.current = window.setTimeout(() => start.current?.(), wait);
        }
      }
    },
    [index, stagger, delay, squash]
  );

  return (
    <span class={styles.Root} key={String(trigger)} ref={setTiming}>
      {children}
    </span>
  );
}
