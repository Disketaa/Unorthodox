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
  /**
   * Whether the character idles. On by default, since a still character is the
   * odd one out; off for rows that are changing anyway.
   */
  moving?: boolean;
  /** Draws it as the chosen one, which also squashes it. */
  selected?: boolean;
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
export function Character({
  character,
  color,
  size = 'Medium',
  moving = true,
  selected = false,
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
        * Two pops, one mechanism. The outer reacts to being chosen, the inner
        * to arriving: a new character, or one wearing a new tint. They are
        * separate elements so their squashes compose instead of overwriting one
        * another, and each is keyed on the thing it reacts to, so a change to the
        * other does not replay it.
       */}
      <Pop trigger={selected ? 'chosen' : 'unchosen'} variant="Effort">
        <Pop trigger={color} variant="Appear">
          <Art />
        </Pop>
      </Pop>
    </span>
  );
}
