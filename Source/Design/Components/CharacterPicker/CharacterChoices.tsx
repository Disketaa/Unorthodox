import { CharacterColor, CharacterId } from '@/Core';
import { Character } from '../Character';
import { ColorSwatch } from '../ColorSwatch';
import styles from './CharacterPicker.module.css';

/** A selectable choice, wrapping a drawing in a button. */
function Choice({
  label,
  selected,
  compact = false,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  /** Tighter padding, for choices that are a solid disc rather than a drawing. */
  compact?: boolean;
  onSelect: () => void;
  children: preact.ComponentChildren;
}) {
  const classes = [
    styles.Choice,
    compact && styles.ChoiceCompact,
    selected && styles.Selected,
  ]
    .filter(Boolean)
    .join(' ');
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
      <Character character={id} color={color} size="Fill" selected={selected} />
    </Choice>
  );
}

export interface ColorChoiceProps {
  name: CharacterColor;
  label: string;
  selected: boolean;
  /** Reports the tint alone; the character is already fixed by the grid. */
  onPick: (color: CharacterColor) => void;
}

/**
 * One tint in the row, as a disc.
 *
 * The character argument is not needed here: a disc shows the colour on its own,
 * and the character currently worn is already shown in full above.
 */
export function ColorChoice({ name, label, selected, onPick }: ColorChoiceProps) {
  return (
    <Choice label={label} selected={selected} compact onSelect={() => onPick(name)}>
      <ColorSwatch color={name} size="Fill" />
    </Choice>
  );
}
