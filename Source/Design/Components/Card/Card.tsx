import { ComponentChildren } from "preact";
import styles from "./Card.module.css";

export type CardVariant = "Elevated" | "Outlined" | "Plain";

export interface CardProps {
  variant?: CardVariant;
  children?: ComponentChildren;
}

export function Card({ variant = "Elevated", children }: CardProps) {
  return <div class={`${styles.Root} ${styles[`Variant${variant}`]}`}>{children}</div>;
}
