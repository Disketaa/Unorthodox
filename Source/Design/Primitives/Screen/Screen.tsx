import { ComponentChildren } from 'preact';
import styles from './Screen.module.css';
import { usePageEnter } from './UsePageEnter';

export type ScreenVertical = 'Bottom' | 'Center' | 'Top';
export type ScreenAlign = 'Center' | 'Start';

export interface ScreenProps {
  /** Where the screen sits in the viewport when it is shorter than it. `Center` for one short
   * block worth arriving at; `Top` for a page of controls, which belongs at the top where its
   * first thing is reachable without scrolling; `Bottom` for keys pressed by a thumb reaching
   * down the screen. */
  vertical?: ScreenVertical;
  /** How containers line up with one another where they sit side by side. `Center` for
   * noticeably different heights read as one arrangement; `Top` for containers that continue
   * one another. No effect once the containers have wrapped into a single column. */
  align?: ScreenAlign;
  children?: ComponentChildren;
}

/** The frame one screen is laid out on: its containers side by side when there is room. Not a
 * `Stack`: a `Stack` is a direction the caller chose, this one takes it from the width, so a
 * screen written once lays out on a phone and a desktop without knowing which it is on. */
export function Screen({ vertical = 'Top', align = 'Start', children }: ScreenProps) {
  // Every screen arrives through here, so the fade is declared once rather than
  // per screen, and a screen nobody remembered still fades.
  usePageEnter();

  return (
    <div class={`${styles.Root} ${styles[`Vertical${vertical}`]} ${styles[`Align${align}`]}`}>
      {children}
    </div>
  );
}
