import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import styles from './CharacterPicker.module.css';

/** A selectable choice, wrapping a drawing in a button. */
function Choice({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  children: preact.ComponentChildren;
}) {
  const classes = selected ? `${styles.Choice} ${styles.Selected}` : styles.Choice;
  return (
    <button
      type="button"
      class={classes}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export interface CharacterChoiceProps {
  id: CharacterId;
  color: CharacterColor;
  label: string;
  selected: boolean;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/**
 * One character in the grid.
 *
 * The drawing carries no text of its own, so the button takes its name from the
 * caller and reports itself as pressed when it is the character currently worn.
 */
export function CharacterChoice({
  id,
  color,
  label,
  selected,
  onPick,
}: CharacterChoiceProps) {
  return (
    <Choice label={label} selected={selected} onSelect={() => onPick(id, color)}>
      <Character character={id} color={color} size="Large" />
    </Choice>
  );
}

export interface ColorChoiceProps {
  name: CharacterColor;
  character: CharacterId;
  label: string;
  selected: boolean;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/** One tint in the row, previewed on the character currently worn. */
export function ColorChoice({
  name,
  character,
  label,
  selected,
  onPick,
}: ColorChoiceProps) {
  return (
    <Choice label={label} selected={selected} onSelect={() => onPick(character, name)}>
      <Character character={character} color={name} size="Small" />
    </Choice>
  );
}
