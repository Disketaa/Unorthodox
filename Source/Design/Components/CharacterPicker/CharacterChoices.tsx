import { CharacterColor } from '@/Core';
import { playSound } from '../../Sounds';
import { ColorSwatch } from '../ColorSwatch';
import styles from './CharacterPicker.module.css';

export interface ColorChoiceProps {
  name: CharacterColor;
  label: string;
  selected: boolean;
  onPick: (color: CharacterColor) => void;
}

/** One tint, as a button. The drawing it holds is a plain block of colour: the row above already
 * shows every character at full size, and repeating that artwork would make the palette heavier
 * than the choice needs. */
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
      onClick={() => {
        // The pop belongs to the press, so it plays whether or not the tint
        // changes: picking the tint you already wear is still a press.
        playSound('Pop');
        onPick(name);
      }}
      aria-pressed={selected}
      aria-label={label}
    >
      <ColorSwatch color={name} size="Fill" shape="Square" />
    </button>
  );
}
