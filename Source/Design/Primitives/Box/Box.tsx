import { ComponentChildren } from "preact";
import styles from "./Box.module.css";

export type BoxSize = "Xs" | "Sm" | "Md" | "Lg" | "Xl";

export interface BoxProps {
  children?: ComponentChildren;
  padding?: BoxSize;
  margin?: BoxSize;
}

export function Box({ children, padding, margin }: BoxProps) {
  const classes = [
    styles.Root,
    padding && styles[`Padding${padding}`],
    margin && styles[`Margin${margin}`],
  ]
    .filter(Boolean)
    .join(" ");
  return <div class={classes}>{children}</div>;
}