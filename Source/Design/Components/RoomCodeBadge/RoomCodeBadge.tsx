import styles from './RoomCodeBadge.module.css';

export interface RoomCodeBadgeProps {
  code: string;
}

export function RoomCodeBadge({ code }: RoomCodeBadgeProps) {
  return (
    <span class={styles.Root}>
      {/* A marker, not copy: it says "this was a number" the way a receipt does. */}
      <span class={styles.Marker}>№</span>
      {code}
    </span>
  );
}
