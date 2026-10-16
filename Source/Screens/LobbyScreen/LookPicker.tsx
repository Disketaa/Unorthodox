import { LobbyCategory } from './LobbyCategory';
import { CharacterPicker } from '@/Design/Components';
import { CharacterColor, CharacterId } from '@/Core';
import { Strings } from '@/Content';

/** The picker for this player's own character. In a card, so the editing area reads as one thing
 * against the roster above and the start button below. Titled with the player's own name: a
 * card headed by it is their sheet of paper. */
export function LookPicker({
  ownName,
  ownLook,
  onPick,
}: {
  ownName: string;
  ownLook: { character: CharacterId; color: CharacterColor };
  onPick: (character: CharacterId, color: CharacterColor) => void;
}) {
  return (
    <LobbyCategory title={ownName}>
      <CharacterPicker
        character={ownLook.character}
        color={ownLook.color}
        labels={{
          character: Strings.characters.names,
          color: Strings.characters.colors,
          pickCharacter: Strings.characters.pickCharacter,
          customize: Strings.characters.customize,
        }}
        onPick={onPick}
      />
    </LobbyCategory>
  );
}
