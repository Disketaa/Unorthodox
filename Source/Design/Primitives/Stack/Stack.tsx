import { ComponentChildren } from "preact";
import styles from "./Stack.module.css";

export type StackDirection = "Horizontal" | "Vertical";
export type StackAlign = "Start" | "Center" | "End" | "Stretch";
export type StackJustify = "Start" | "Center" | "End" | "Between" | "Around";
export type StackGap = "Xs" | "Sm" | "Md" | "Lg" | "Xl";
export type StackSize = "Xs" | "Sm" | "Md" | "Lg" | "Xl";

/**
 * How the row's children take the width the row has.
 *
 * `Content` leaves each child at its own width, so the row is only as wide as
 * what is in it. `Even` hands every child one equal share of the whole row.
 */
export type StackFill = "Content" | "Even";

export interface StackProps {
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  fill?: StackFill;
  /**
   * Whether the row takes the height its parent has left.
   *
   * The question `Screen` answers for a whole page of containers, and this
   * answers for one row inside a page: a stack is otherwise exactly as tall as
   * what is in it, so a child that centres itself in the space below a sibling
   * has no space to be given. `1 0 auto` grows into the room and never shrinks
   * below its own content, which is what lets the same row still scroll when
   * its contents are taller than the room.
   */
  grow?: boolean;
  /**
   * Whether the row keeps its contents on the screen rather than letting the
   * page scroll.
   *
   * For the one row that is the whole game: the player's own card above and the
   * bank of theme cards below it are both fixed arrangements, and on a device
   * turned on its side there is not height for both. Scrolling is the wrong
   * answer for a screen a player is looking at rather than reading — half the
   * themes on offer end up below the fold, and the card has to be scrolled back
   * to — so the row clips instead and what does not fit is simply not drawn.
   */
  clip?: boolean;
  children?: ComponentChildren;
  padding?: StackSize;
  margin?: StackSize;
}

export function Stack({
  direction = "Vertical",
  gap = "Md",
  align = "Stretch",
  justify = "Start",
  fill = "Content",
  grow = false,
  clip = false,
  children,
  padding,
  margin,
}: StackProps) {
  const classes = [
    styles.Root,
    styles[`Direction${direction}`],
    styles[`Gap${gap}`],
    styles[`Align${align}`],
    styles[`Justify${justify}`],
    fill === "Even" && styles.FillEven,
    grow && styles.Grow,
    clip && styles.Clip,
    padding && styles[`Padding${padding}`],
    margin && styles[`Margin${margin}`],
  ]
    .filter(Boolean)
    .join(" ");
  return <div class={classes}>{children}</div>;
}