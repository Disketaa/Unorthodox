import { ComponentChildren } from 'preact';
import styles from './Pop.module.css';

export type PopVariant =
  /** Grows out of nothing: a character turning up for the first time. */
  | 'Appear'
  /** Squashes only: a character reacting to being chosen. */
  | 'Effort';

export interface PopProps {
  /**
   * What counts as "the same reaction". Change it to replay the pop.
   *
   * The element is keyed on this, so a new value is a new element and the
   * browser runs the animation again from the start. Pass the thing that just
   * changed, not a counter, so the pop is tied to the reason it happened.
   */
  trigger: string | number;
  variant?: PopVariant;
  children?: ComponentChildren;
}

/**
 * Runs its child through the squash-and-stretch pop, replaying whenever the
 * trigger changes.
 *
 * Uses the individual `scale`, `rotate` and `translate` properties, which
 * compose with one another and with any `transform` on an ancestor, so a pop can
 * play on top of an idle sway without either replacing the other.
 */
export function Pop({ trigger, variant = 'Appear', children }: PopProps) {
  const classes = [styles.Root, styles[variant]].join(' ');
  return (
    <span class={classes} key={`${variant}-${trigger}`}>
      {children}
    </span>
  );
}
