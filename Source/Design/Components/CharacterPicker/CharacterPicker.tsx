import { CharacterColor, CharacterId, CharacterColors, CharacterIds } from '@/Core';
import { CharacterChoice, ColorChoice } from './CharacterChoices';
import styles from './CharacterPicker.module.css';

/** Display names for the choices, supplied by the caller so all text lives in Strings. */
export interface CharacterPickerLabels {
  character: Readonly<Record<CharacterId, string>>;
  color: Readonly<Record<CharacterColor, string>>;
}

export interface CharacterPickerProps {
  character: CharacterId;
  color: CharacterColor;
  labels: CharacterPickerLabels;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/**
 * The grid of characters and the row of tints, shown in the lobby until play
 * starts.
 *
 * Tints are previewed on the character currently worn, so the effect of a
 * choice is visible before it is made. Every choice is a real button carrying
 * its own name and pressed state, so the whole picker works from the keyboard
 * and announces properly.
 */
export function CharacterPicker({
  character,
  color,
  labels,
  onPick,
}: CharacterPickerProps) {
  return (
    <div class={styles.Root}>
      <div class={styles.Characters} role="group">
        {CharacterIds.map((id) => (
          <CharacterChoice
            key={id}
            id={id}
            color={color}
            label={labels.character[id]}
            selected={id === character}
            onPick={onPick}
          />
        ))}
      </div>
      <div class={styles.Colors} role="group">
        {CharacterColors.map((name) => (
          <ColorChoice
            key={name}
            name={name}
            character={character}
            label={labels.color[name]}
            selected={name === color}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}
