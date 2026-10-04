import { ComponentChildren } from 'preact';
import { useCallback } from 'preact/hooks';
import styles from './Pop.module.css';

export interface PopProps {
  /**
   * What counts as "the same reaction". Change it to replay the pop.
   *
   * The element is keyed on this, so a new value is a new element and the browser runs the
   * animation again from the start. Pass the thing that just changed, not a counter, so the pop
   * is tied to the reason it happened. Leave it undefined for something that never reacts: the
   * value never changes, so it plays once on mount and then never again.
   */
  trigger: string | number | undefined;
  /** Its place in a row, so a row of reactions ripples instead of firing in unison. */
  index?: number;
  children?: ComponentChildren;
}

/**
 * Runs its child through the squash-and-stretch pop, replaying whenever the trigger changes.
 *
 * Uses the individual `scale`, `rotate` and `translate` properties, which compose with one
 * another and with any `transform` on an ancestor, so a pop can play on top of an idle sway
 * without either replacing the other.
 */
export function Pop({ trigger, index, children }: PopProps) {
  // Set from a ref callback rather than an effect, and the difference is the whole
  // ripple. An effect runs after the first paint, by which point the animation has
  // already begun, and a custom property changed mid-animation is too late to
  // affect the delay it was supposed to set: every character animated at once with
  // no wait. A ref callback runs during the commit, before the browser has painted
  // anything, so the delay is in place before the animation exists.
  const setIndex = useCallback(
    (node: HTMLSpanElement | null) => {
      node?.style.setProperty('--Pop-Index', String(index ?? 0));
    },
    [index],
  );

  return (
    <span class={styles.Root} key={String(trigger)} ref={setIndex}>
      {children}
    </span>
  );
}
