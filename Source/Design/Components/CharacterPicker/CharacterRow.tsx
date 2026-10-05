import { CharacterColor, CharacterId, CharacterIds } from '@/Core';
import { playSound } from '../../Sounds';
import { Character } from '../Character';
import styles from './CharacterPicker.module.css';

export interface CharacterRowProps {
  character: CharacterId;
  color: CharacterColor;
  /** Names for the character buttons. */
  labels: Readonly<Record<CharacterId, string>>;
  /** Accessible label for a button that picks a character. */
  describe: (name: string) => string;
  pulse: number;
  onPick: (character: CharacterId) => void;
}

/** The whole cast, one button each. Kept in its own file because the picker is three rows and
 * each row is a control of its own. Every cell the same size, so stepping moves by a constant
 * distance and the chosen one is found by counting rather than by recognising a shape. */
export function CharacterRow({
  character,
  color,
  labels,
  describe,
  pulse,
  onPick,
}: CharacterRowProps) {
  return (
    <div class={styles.Characters} role="group">
      {CharacterIds.map((id, index) => (
        <CharacterChoice
          key={id}
          id={id}
          index={index}
          color={color}
          chosen={id === character}
          pulse={id === character ? pulse : undefined}
          label={describe(labels[id])}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

interface CharacterChoiceProps {
  id: CharacterId;
  index: number;
  color: CharacterColor;
  chosen: boolean;
  pulse: number | undefined;
  label: string;
  onPick: (character: CharacterId) => void;
}

/** One character in the row, marked when it is the chosen one. */
function CharacterChoice({
  id,
  index,
  color,
  chosen,
  pulse,
  label,
  onPick,
}: CharacterChoiceProps) {
  const classes = chosen ? `${styles.Choice} ${styles.Chosen}` : styles.Choice;

  return (
    <button
      type="button"
      data-character={id}
      class={classes}
      onClick={() => {
        playSound('Pop');
        onPick(id);
      }}
      aria-pressed={chosen}
      aria-label={label}
    >
      <Character
        character={id}
        color={color}
        size="Fill"
        index={index}
        pulse={pulse}
      />
    </button>
  );
}
