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
  /**
   * Whether this chip is the player looking at the screen.
   *
   * In a full roster nobody can find themselves among a dozen identical chips, so
   * the local player is outlined and everybody else is not.
   */
  isSelf?: boolean;
}

export function PlayerChip({
  name,
  character,
  color,
  index,
  isHost = false,
  isOnline = true,
  isSelf = false,
}: PlayerChipProps) {
  return (
    <div class={isSelf ? `${styles.Root} ${styles.Self}` : styles.Root}>
      {isHost && <span class={styles.HostIndicator} />}
      <Character character={character} color={color} size="Small" index={index} />
      <span class={styles.Name}>{name}</span>
      <span class={`${styles.Dot} ${isOnline ? styles.Online : styles.Offline}`} />
    </div>
  );
}
