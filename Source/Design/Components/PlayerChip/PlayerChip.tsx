import styles from "./PlayerChip.module.css";

export interface PlayerChipProps {
  name: string;
  isHost?: boolean;
  isOnline?: boolean;
}

export function PlayerChip({ name, isHost = false, isOnline = true }: PlayerChipProps) {
  return (
    <div class={styles.Root}>
      {isHost && <span class={styles.HostIndicator} />}
      <span class={styles.Name}>{name}</span>
      <span class={`${styles.Dot} ${isOnline ? styles.Online : styles.Offline}`} />
    </div>
  );
}