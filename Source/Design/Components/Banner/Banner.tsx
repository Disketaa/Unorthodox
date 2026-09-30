import { ComponentChildren } from "preact";
import styles from "./Banner.module.css";

export type BannerVariant = "Info" | "Success" | "Warning" | "Error";

export interface BannerProps {
  variant?: BannerVariant;
  children?: ComponentChildren;
}

export function Banner({ variant = "Info", children }: BannerProps) {
  return (
    <div class={`${styles.Root} ${styles[`Variant${variant}`]}`}>
      {children}
    </div>
  );
}