import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import { IconButton } from '../IconButton';
import styles from './PlayerChip.module.css';

export interface PlayerChipProps {
  name: string;
  character: CharacterId;
  color: CharacterColor;
  /** Its place in the roster, so a full lobby ripples rather than popping at once. */
  index?: number;
  isHost?: boolean;
  /** Whether the host still has this player on the line. A player who dropped is still in the
   * roster, because they may yet come back, so this dims the name rather than removing the
   * chip. */
  isOnline?: boolean;
  /** Whether this chip is the player looking at the screen. In a full roster nobody can find
   * themselves among a dozen identical chips, so the local player is outlined and everybody
   * else is not. */
  isSelf?: boolean;
  /** Whether this seat watches without taking part in rounds. */
  isSpectator?: boolean;
  /** The word shown on a spectator seat. */
  spectatorStatus?: string;
  /** When given, the host is offered a way to move this seat in or out of play. */
  onSetSpectator?: () => void;
  /** What the spectator control says, for anyone who cannot see the mark. */
  spectatorLabel?: string;
  /** When given, the host is offered a way to remove this player. Only the host's own roster
   * passes it, so a kick can never appear on the chip of the player who would be removing
   * themselves. */
  onKick?: () => void;
  /** What the kick says, for anyone who cannot see the mark. */
  kickLabel?: string;
}

export function PlayerChip({
  name,
  character,
  color,
  index,
  isHost = false,
  isOnline = true,
  isSelf = false,
  isSpectator = false,
  spectatorStatus = '',
  onSetSpectator,
  spectatorLabel = '',
  onKick,
  kickLabel = '',
}: PlayerChipProps) {
  return (
    <div
      class={`${styles.Root} ${isOnline ? '' : styles.Offline} ${isSelf ? styles.Self : ''}`}
    >
      <Character character={character} color={color} size="Small" index={index} />
      <span class={styles.Name}>{name}</span>
      {isSpectator && <span class={styles.Spectator}>{spectatorStatus}</span>}
      {isHost && (
        <span class={styles.Crown} aria-hidden="true">
          <span class={styles.CrownIcon} />
        </span>
      )}
      {onSetSpectator !== undefined && (
        <IconButton icon="Turn" label={spectatorLabel} size="Small" onClick={onSetSpectator} />
      )}
      {onKick !== undefined && (
        <IconButton icon="Kick" label={kickLabel} size="Small" onClick={onKick} />
      )}
    </div>
  );
}
