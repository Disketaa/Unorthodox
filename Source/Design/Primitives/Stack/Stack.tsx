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
 * `Content` leaves each child at its own width, so the row is only as wide as what
 * is in it. `Even` hands every child one equal share of the whole row.
 */
export type StackFill = "Content" | "Even";

export interface StackProps {
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  fill?: StackFill;
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
    padding && styles[`Padding${padding}`],
    margin && styles[`Margin${margin}`],
  ]
    .filter(Boolean)
    .join(" ");
  return <div class={classes}>{children}</div>;
}