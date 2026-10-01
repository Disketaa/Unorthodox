import { ComponentChildren } from "preact";
import styles from "./Screen.module.css";

export type ScreenVertical = "Center" | "Top";
export type ScreenAlign = "Center" | "Start";

export interface ScreenProps {
  /**
   * Where the screen sits in the viewport when it is shorter than it.
   *
   * `Center` for a screen that is one short block worth arriving at, such as the
   * entry screen. `Top` for one that is a page of controls, which belongs at the top
   * where the first thing on it is reachable without scrolling to find it.
   */
  vertical?: ScreenVertical;
  /**
   * How containers line up with one another where they sit side by side.
   *
   * `Center` where the containers are of noticeably different heights and the point
   * is that they read as one arrangement, which is the entry screen: a wordmark is
   * much shorter than the card of fields beside it, and aligned by its top edge the
   * mark floats beside the middle of the menu instead of sitting in the middle of it.
   * `Top` for containers that are one another's continuation, where the first line of
   * each lining up is the thing being read.
   *
   * Has no effect once the containers have wrapped into one column, since each is
   * then the only thing in its own row.
   */
  align?: ScreenAlign;
  children?: ComponentChildren;
}

/**
 * The frame one screen is laid out on: its containers side by side when there is
 * room, stacked when there is not.
 *
 * Every screen is this rather than a `Stack`, and the two are not interchangeable.
 * A `Stack` is a direction the caller has chosen; this one takes the direction from
 * the width, so a screen written once lays out correctly on a phone and on a desktop
 * without the screen knowing which one it is on. Nothing in `Screens/` names a
 * direction for its own containers, and nothing reads the window.
 *
 * The cap on a row is the width rather than a breakpoint, and `min()` on the track
 * is the whole reason it works on a narrow screen: a track is one container wide,
 * floored at `min(480px, 100%)` so a phone narrower than a container shrinks the
 * track instead of overflowing it. Since the frame is at most `--Layout-ColumnsMax`
 * tracks wide, `auto-fit` can never fit a fourth one, and a fifth container wraps
 * without a width query anywhere in the codebase saying where.
 *
 * `vertical` and `align` are two different questions and both are per screen. The
 * first is where the whole set sits in the viewport; the second is how the
 * containers line up with one another inside it.
 */
export function Screen({ vertical = "Top", align = "Start", children }: ScreenProps) {
  return (
    <div
      class={`${styles.Root} ${styles[`Vertical${vertical}`]} ${styles[`Align${align}`]}`}
    >
      {children}
    </div>
  );
}