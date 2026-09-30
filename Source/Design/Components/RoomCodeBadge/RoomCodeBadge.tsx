import styles from "./RoomCodeBadge.module.css";

export interface RoomCodeBadgeProps {
  code: string;
}

export function RoomCodeBadge({ code }: RoomCodeBadgeProps) {
  return (
    <span class={styles.Root}>
      {/* A separator, not copy: it marks the code the way the URL does. */}
      <span class={styles.Prefix}>#</span>
      {code}
    </span>
  );
}
