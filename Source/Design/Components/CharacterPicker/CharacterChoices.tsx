import { CharacterColor } from '@/Core';
import { ColorSwatch } from '../ColorSwatch';
import styles from './CharacterPicker.module.css';

export interface ColorChoiceProps {
  name: CharacterColor;
  label: string;
  selected: boolean;
  onPick: (color: CharacterColor) => void;
}

/**
 * One tint, as a button.
 *
 * The drawing it holds is a plain disc: the row above already shows every character
 * at full size, so repeating that artwork nine more times would make the palette
 * heavier than the choice needs. The button carries the name, so the choice is
 * announced properly and the disc only has to show which colour it is.
 */
export function ColorChoice({
  name,
  label,
  selected,
  onPick,
}: ColorChoiceProps) {
  const classes = selected
    ? `${styles.Choice} ${styles.Chosen}`
    : styles.Choice;

  return (
    <button
      type="button"
      class={classes}
      onClick={() => onPick(name)}
      aria-pressed={selected}
      aria-label={label}
    >
      <ColorSwatch color={name} size="Fill" />
    </button>
  );
}
