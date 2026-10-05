import { CharacterColor, CharacterId } from '@/Core';
import { Pop } from '@/Design/Primitives';
import { artFor } from '../../Characters';
import { useCharacterMotion } from './UseCharacterMotion';
import styles from './Character.module.css';

export type CharacterSize = 'Small' | 'Medium' | 'Large' | 'Fill';

export interface CharacterProps {
  character: CharacterId;
  color: CharacterColor;
  size?: CharacterSize;
  /** Whether the character idles. On by default, since a still character is the odd one out; off
   * for rows that are changing anyway. */
  moving?: boolean;
  /** Plays the reaction squash. Change the value to react again. Deliberately not a boolean:
   * that would also change when a character is *un*chosen, popping the one that lost the
   * choice. A per-character count that only goes up means only the chosen one reacts. */
  pulse?: number;
  /** Its place in a row, so a row of reactions ripples rather than firing at once. */
  index?: number;
}

/** A player drawn as one of the characters, in one of the tints. `Fill` takes its size from the
 * space given, which is what the picker needs on a narrow screen; the named sizes are fixed
 * tokens. Decorative: it repeats the name beside it. */
export function Character({
  character,
  color,
  size = 'Medium',
  moving = true,
  pulse,
  index,
}: CharacterProps) {
  const Art = artFor(character);
  const motionRef = useCharacterMotion();
  const classes = [
    styles.Root,
    styles[`Size${size}`],
    styles[color],
    moving ? styles.Moving : styles.Still,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span class={classes} ref={motionRef}>
      {/*
        * One pop, keyed on everything that should make it play: a new character,
        * a new tint, or a new pulse. Turning up, changing and being chosen are
        * the same movement, so there is one of them rather than one per reason.
       */}
      <Pop trigger={`${character}-${color}-${pulse}`} index={index}>
        <Art />
      </Pop>
    </span>
  );
}
