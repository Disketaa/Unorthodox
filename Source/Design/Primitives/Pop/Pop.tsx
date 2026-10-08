import { ComponentChildren } from 'preact';
import { useCallback } from 'preact/hooks';
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
  children?: ComponentChildren;
}

/** Runs its child through the squash-and-stretch pop, replaying whenever the trigger changes.
 * Uses the individual `scale`, `rotate` and `translate` properties, which compose with an
 * ancestor's `transform`, so a pop plays over an idle sway without either replacing the other. */
export function Pop({ trigger, index, stagger, children }: PopProps) {
  // Set from a ref callback rather than an effect, and the difference is the whole ripple. An
  // effect runs after the first paint, by which point the animation has begun, and a custom
  // property changed mid-animation is too late to affect the delay it was supposed to set.
  const setIndex = useCallback(
    (node: HTMLSpanElement | null) => {
      if (node === null) {
        return;
      }
      node.style.setProperty('--Pop-Index', String(index ?? 0));
      if (stagger !== undefined) {
        node.style.setProperty('--Pop-Stagger', stagger);
      }
    },
    [index, stagger]
  );

  return (
    <span class={styles.Root} key={String(trigger)} ref={setIndex}>
      {children}
    </span>
  );
}
