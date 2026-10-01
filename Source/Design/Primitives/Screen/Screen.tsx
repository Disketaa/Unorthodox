import { ComponentChildren } from "preact";
import styles from "./Screen.module.css";

export type ScreenVertical = "Center" | "Top";

export interface ScreenProps {
  /**
   * Where the screen sits in the viewport when it is shorter than it.
   *
   * `Center` for a screen that is one short block worth arriving at, such as the
   * entry screen. `Top` for one that is a page of controls, which belongs at the top
   * where the first thing on it is reachable without scrolling to find it.
   */
  vertical?: ScreenVertical;
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
 */
export function Screen({ vertical = "Top", children }: ScreenProps) {
  return (
    <div class={`${styles.Root} ${styles[`Vertical${vertical}`]}`}>
      {children}
    </div>
  );
}