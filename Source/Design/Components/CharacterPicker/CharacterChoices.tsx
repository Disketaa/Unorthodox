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
 * The drawing it holds is a plain block of colour: the row above already shows every
 * character at full size, so repeating that artwork eight more times would make the
 * palette heavier than the choice needs. The swatch is square and carries no border
 * of its own, because the button around it is already the outline of the cell and
 * two frames around one swatch read as clutter. The button carries the name, so the
 * choice is announced properly and the swatch only has to show which colour it is.
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
      <ColorSwatch color={name} size="Fill" shape="Square" />
    </button>
  );
}
