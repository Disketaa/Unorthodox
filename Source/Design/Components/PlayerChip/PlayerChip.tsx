import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import styles from './PlayerChip.module.css';

export interface PlayerChipProps {
  name: string;
  character: CharacterId;
  color: CharacterColor;
  isHost?: boolean;
  isOnline?: boolean;
}

export function PlayerChip({
  name,
  character,
  color,
  isHost = false,
  isOnline = true,
}: PlayerChipProps) {
  return (
    <div class={styles.Root}>
      {isHost && <span class={styles.HostIndicator} />}
      <Character character={character} color={color} size="Small" />
      <span class={styles.Name}>{name}</span>
      <span class={`${styles.Dot} ${isOnline ? styles.Online : styles.Offline}`} />
    </div>
  );
}
