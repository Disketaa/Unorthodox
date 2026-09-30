import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import styles from './PlayerChip.module.css';

export interface PlayerChipProps {
  name: string;
  character: CharacterId;
  color: CharacterColor;
  /** Its place in the roster, so a full lobby ripples rather than popping at once. */
  index?: number;
  isHost?: boolean;
  isOnline?: boolean;
}

export function PlayerChip({
  name,
  character,
  color,
  index,
  isHost = false,
  isOnline = true,
}: PlayerChipProps) {
  return (
    <div class={styles.Root}>
      {isHost && <span class={styles.HostIndicator} />}
      <Character character={character} color={color} size="Small" index={index} />
      <span class={styles.Name}>{name}</span>
      <span class={`${styles.Dot} ${isOnline ? styles.Online : styles.Offline}`} />
    </div>
  );
}
