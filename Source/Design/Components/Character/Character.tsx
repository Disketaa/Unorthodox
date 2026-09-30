import { CharacterColor, CharacterId } from '@/Core';
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
  /** Draws it as the chosen one: a little larger, and standing straight. */
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
    selected && styles.Selected,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span class={classes} ref={motionRef}>
      <span class={styles.Layer}>
        {/*
          * Keyed on the tint, so changing colour remounts this element and the
          * reveal plays again: a character switching colour is a new drawing
          * arriving, and the player picked it. The key is on this inner element
          * rather than the outer one so the idle motion keeps its rolled values
          * and does not visibly restart underneath the reveal.
         */}
        <span class={`${styles.Reveal} ${styles.Appearing}`} key={color}>
          <Art />
        </span>
      </span>
    </span>
  );
}
