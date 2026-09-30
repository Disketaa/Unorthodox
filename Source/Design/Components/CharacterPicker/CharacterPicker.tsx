import { CharacterColor, CharacterId, CharacterColors, CharacterIds } from '@/Core';
import { useState } from 'preact/hooks';
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
 * Tints are discs rather than the artwork again, since the grid above already
 * shows every drawing at full size. Every choice is a real button carrying its
 * own name and pressed state, so the whole picker works from the keyboard and
 * announces properly.
 */
export function CharacterPicker({
  character,
  color,
  labels,
  onPick,
}: CharacterPickerProps) {
  /**
   * How many times each character has been picked, so the chosen one pops on
   * every click, including repeats.
   *
   * A count per character rather than one shared counter: a shared counter would
   * pop all nine at once, and a plain "is selected" flag would also pop the
   * character that was just deselected, which never asked for anything.
   */
  const [picks, setPicks] = useState<Map<CharacterId, number>>(() => new Map());

  /**
   * Choosing a character pops that one. It is keyed on the pick count rather than
   * on whether the character is currently chosen, so that clicking the same
   * character twice pops it twice, and so that the character that just *lost* the
   * choice is left alone: it never asked for anything.
   */
  const pickCharacter = (chosen: CharacterId, chosenColor: CharacterColor) => {
    setPicks((previous) => new Map(previous).set(chosen, (previous.get(chosen) ?? 0) + 1));
    onPick(chosen, chosenColor);
  };

  /**
   * Picking a tint keeps the character. The character in the grid is already
   * keyed on its colour, so it pops from the arrival rather than needing a pulse
   * of its own here.
   */
  const pickColor = (chosen: CharacterColor) => onPick(character, chosen);

  return (
    <div class={styles.Root}>
      <CharacterGrid
        color={color}
        labels={labels}
        picks={picks}
        character={character}
        onPick={pickCharacter}
      />
      <ColorRow color={color} labels={labels} onPick={pickColor} />
    </div>
  );
}

interface CharacterGridProps {
  character: CharacterId;
  color: CharacterColor;
  labels: CharacterPickerLabels;
  picks: ReadonlyMap<CharacterId, number>;
  onPick: (character: CharacterId, color: CharacterColor) => void;
}

/** The nine drawings, in the order they are drawn, each waiting its turn. */
function CharacterGrid({
  character,
  color,
  labels,
  picks,
  onPick,
}: CharacterGridProps) {
  return (
    <div class={styles.Characters} role="group">
      {CharacterIds.map((id, index) => (
        <CharacterChoice
          key={id}
          id={id}
          color={color}
          label={labels.character[id]}
          selected={id === character}
          pulse={picks.get(id)}
          index={index}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

interface ColorRowProps {
  color: CharacterColor;
  labels: CharacterPickerLabels;
  onPick: (color: CharacterColor) => void;
}

/** The tints, as discs, each labelled by name. */
function ColorRow({ color, labels, onPick }: ColorRowProps) {
  return (
    <div class={styles.Colors} role="group">
      {CharacterColors.map((name) => (
        <ColorChoice
          key={name}
          name={name}
          label={labels.color[name]}
          selected={name === color}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
