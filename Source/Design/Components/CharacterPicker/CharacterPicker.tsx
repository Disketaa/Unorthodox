import { CharacterColor, CharacterId, CharacterColors } from '@/Core';
import { useState } from 'preact/hooks';
import { CharacterStrip } from './CharacterStrip';
import { ColorChoice } from './CharacterChoices';
import styles from './CharacterPicker.module.css';

/** Display names for the choices, supplied by the caller so all text lives in Strings. */
export interface CharacterPickerLabels {
  character: Readonly<Record<CharacterId, string>>;
  color: Readonly<Record<CharacterColor, string>>;
  /** Names one character in the row and says what clicking it does. */
  pickCharacter: (name: string) => string;
}

export interface CharacterPickerProps {
  character: CharacterId;
  color: CharacterColor;
  labels: CharacterPickerLabels;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/**
 * One character, and the tints it can wear.
 *
 * The cast is a single scrolling row with the chosen character in the middle,
 * rather than one large preview with a button to step through: the row shows what
 * stepping would give, and picking any character moves it to the middle.
 */
export function CharacterPicker({
  character,
  color,
  labels,
  onPick,
}: CharacterPickerProps) {
  /**
   * Bumped on every change so the character pops, so that changing a tint pops it
   * exactly once and stepping through the cast pops each one as it arrives.
   */
  const [pulse, setPulse] = useState(0);

  const pick = (next: CharacterId) => {
    setPulse((previous) => previous + 1);
    onPick(next, color);
  };

  return (
    <div class={styles.Root}>
      <CharacterStrip
        character={character}
        color={color}
        labels={labels.character}
        describe={labels.pickCharacter}
        pulse={pulse}
        onPick={pick}
      />
      <ColorGrid
        character={character}
        color={color}
        labels={labels}
        onPick={onPick}
      />
    </div>
  );
}

interface ColorGridProps {
  character: CharacterId;
  color: CharacterColor;
  labels: CharacterPickerLabels;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/** The tints, a row of discs under the characters. */
function ColorGrid({ character, color, labels, onPick }: ColorGridProps) {
  return (
    <div class={styles.Colors} role="group">
      {CharacterColors.map((name) => (
        <ColorChoice
          key={name}
          name={name}
          label={labels.color[name]}
          selected={name === color}
          onPick={(chosen) => onPick(character, chosen)}
        />
      ))}
    </div>
  );
}
