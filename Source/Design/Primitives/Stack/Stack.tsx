import { ComponentChildren } from "preact";
import styles from "./Stack.module.css";

export type StackDirection = "Horizontal" | "Vertical";
export type StackAlign = "Start" | "Center" | "End" | "Stretch";
export type StackJustify = "Start" | "Center" | "End" | "Between" | "Around";
export type StackGap = "Xs" | "Sm" | "Md" | "Lg" | "Xl";
export type StackSize = "Xs" | "Sm" | "Md" | "Lg" | "Xl";

export interface StackProps {
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  children?: ComponentChildren;
  padding?: StackSize;
  margin?: StackSize;
}

export function Stack({
  direction = "Vertical",
  gap = "Md",
  align = "Stretch",
  justify = "Start",
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
    padding && styles[`Padding${padding}`],
    margin && styles[`Margin${margin}`],
  ]
    .filter(Boolean)
    .join(" ");
  return <div class={classes}>{children}</div>;
}