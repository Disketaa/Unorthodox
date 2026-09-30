import { CharacterColor, CharacterId } from '@/Core';
import { artFor } from '../../Characters';
import styles from './Character.module.css';

export type CharacterSize = 'Small' | 'Medium' | 'Large' | 'Fill';

export interface CharacterProps {
  character: CharacterId;
  color: CharacterColor;
  size?: CharacterSize;
}

/**
 * A player drawn as one of the characters, in one of the tints.
 *
 * `Fill` takes its size from the space it is given, which is what the picker
 * needs on a narrow screen; the named sizes are fixed tokens for the roster and
 * the scoreboard, where the line has to be the same length every time.
 *
 * Decorative: the character repeats information the name beside it already
 * carries, so it is hidden from assistive technology rather than given a label
 * that would be read out twice.
 */
export function Character({ character, color, size = 'Medium' }: CharacterProps) {
  const Art = artFor(character);
  const classes = [styles.Root, styles[`Size${size}`], styles[color]].join(' ');

  return (
    <span class={classes}>
      <Art />
    </span>
  );
}
