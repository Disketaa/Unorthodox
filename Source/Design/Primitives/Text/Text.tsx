import { ComponentChildren } from "preact";
import styles from "./Text.module.css";

export type TextVariant = "Title" | "Body" | "Caption" | "Mono";
export type TextFontWeight = "Normal" | "Medium" | "Bold";

export interface TextProps {
  variant?: TextVariant;
  fontWeight?: TextFontWeight;
  children?: ComponentChildren;
}

export function Text({ variant = "Body", fontWeight, children }: TextProps) {
  return (
    <span
      class={`${styles.Root} ${styles[`Variant${variant}`]} ${
        fontWeight ? styles[`Weight${fontWeight}`] : ""
      }`}
    >
      {children}
    </span>
  );
}