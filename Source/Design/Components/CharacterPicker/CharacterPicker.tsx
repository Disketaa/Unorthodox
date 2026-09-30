import { CharacterColor, CharacterId, CharacterColors } from '@/Core';
import { useState } from 'preact/hooks';
import { Character } from '../Character';
import { ColorChoice } from './CharacterChoices';
import { CharacterRow } from './CharacterRow';
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
 * Three rows: the character as it will be seen, the whole cast, the whole palette.
 *
 * The big drawing is there to answer "what will the room see" at a glance, and the
 * two rows under it are the two decisions, kept the same shape so neither reads as
 * part of the other. A single scrolling strip was the earlier shape: it hid most of
 * the cast, needed a drag to reveal it, and made the character and the tint compete
 * for the same horizontal space.
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
      <Preview character={character} color={color} pulse={pulse} />
      <CharacterRow
        character={character}
        color={color}
        labels={labels.character}
        describe={labels.pickCharacter}
        pulse={pulse}
        onPick={pick}
      />
      <ColorRow
        character={character}
        color={color}
        labels={labels}
        onPick={onPick}
      />
    </div>
  );
}

interface PreviewProps {
  character: CharacterId;
  color: CharacterColor;
  pulse: number;
}

/** The chosen character, large and wearing the chosen tint. */
function Preview({ character, color, pulse }: PreviewProps) {
  return (
    <div class={styles.Preview}>
      <Character
        character={character}
        color={color}
        size="Fill"
        pulse={pulse}
      />
    </div>
  );
}

interface ColorRowProps {
  character: CharacterId;
  color: CharacterColor;
  labels: CharacterPickerLabels;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/** The whole palette, one disc each, the chosen one marked. */
function ColorRow({ character, color, labels, onPick }: ColorRowProps) {
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
