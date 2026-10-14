import { ComponentChildren } from 'preact';
import styles from './Screen.module.css';
import { usePageEnter } from './UsePageEnter';

export type ScreenVertical = 'Bottom' | 'Center' | 'Top';
export type ScreenAlign = 'Center' | 'Start';
export type ScreenWidth = 'Readable' | 'Wide';

export interface ScreenProps {
  /** Where the screen sits in the viewport when it is shorter than it. `Center` for one short
   * block worth arriving at, `Top` for a page of controls, `Bottom` for keys pressed by a thumb
   * reaching down the screen. */
  vertical?: ScreenVertical;
  /** How containers line up with one another where they sit side by side. `Center` for
   * noticeably different heights read as one arrangement; `Top` for containers that continue
   * one another. No effect once the containers have wrapped into a single column. */
  align?: ScreenAlign;
  /** How wide a container on this screen may be. `Readable` is the line length a card's text is
   * measured against; `Wide` is twice that, for the writing phase, whose one container is a
   * keyboard rather than text and wants room for fingers rather than for words. */
  width?: ScreenWidth;
  children?: ComponentChildren;
}

/** The frame one screen is laid out on: its containers side by side when there is room. Not a
 * `Stack`: a `Stack` is a direction the caller chose, this one takes it from the width, so a
 * screen written once lays out on a phone and a desktop without knowing which it is on. */
export function Screen({
  vertical = 'Top',
  align = 'Start',
  width = 'Readable',
  children,
}: ScreenProps) {
  // Every screen arrives through here, so the fade is declared once rather than
  // per screen, and a screen nobody remembered still fades.
  usePageEnter();
  // The readable frame is the one with no class of its own: it is the widths above and nothing
  // more, so a class naming it would be a class standing for the absence of a width.
  const classes = [
    styles.Root,
    styles[`Vertical${vertical}`],
    styles[`Align${align}`],
    styles[`Width${width}`],
  ].filter(Boolean);

  return <div class={classes.join(' ')}>{children}</div>;
}
