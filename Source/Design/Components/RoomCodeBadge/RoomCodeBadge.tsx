import styles from "./RoomCodeBadge.module.css";

export interface RoomCodeBadgeProps {
  code: string;
}

export function RoomCodeBadge({ code }: RoomCodeBadgeProps) {
  return <span class={styles.Root}>{code}</span>;
}