import { Screen } from '@/Design/Primitives';
import { CharacterPicker } from '@/Design/Components';
import { CharacterColor, CharacterId } from '@/Core';
import { Strings } from '@/Content';
import { Pace } from '@/Game';
import { LobbyCategory } from './LobbyCategory';
import { LobbyPace } from './LobbyPace';
import { LobbyRoom, type LobbyRoomProps } from './LobbyRoom';

export interface LobbyScreenProps extends LobbyRoomProps {
  /** This player's own name, which titles the character picker. */
  ownPlayerName: string;
  /** This player's own character, once the host has told us which one it kept. */
  ownLook: { character: CharacterId; color: CharacterColor } | undefined;
  /** The pace the room is set to, which only the host can change. */
  pace: Pace;
  onPickLook: (character: CharacterId, color: CharacterColor) => void;
  /** Asking for a pace. The host's click changes the room; a client's is a local look at what
   * that pace would mean, and the host's choice is what comes back. */
  onPickPace: (pace: Pace) => void;
}

/** The picker for this player's own character. In a card, so the editing area reads as one thing
 * against the roster above and the start button below. Titled with the player's own name: a
 * card headed by it is their sheet of paper. */
function LookPicker({
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

/** Waiting room: the room code, the roster, and the character picker. */
export function LobbyScreen({
  roomCode,
  players,
  pace,
  ownPlayerId,
  ownPlayerName,
  ownLook,
  isHost,
  onPickLook,
  onPickPace,
  onStart,
  onExit,
  onKick,
}: LobbyScreenProps) {
  return (
    <Screen>
      <LobbyRoom
        roomCode={roomCode}
        players={players}
        ownPlayerId={ownPlayerId}
        isHost={isHost}
        onStart={onStart}
        onExit={onExit}
        onKick={onKick}
      />
      <LobbyPace pace={pace} isHost={isHost} onPick={onPickPace} />
      {ownLook !== undefined && (
        <LookPicker
          ownName={ownPlayerName}
          ownLook={ownLook}
          onPick={onPickLook}
        />
      )}
    </Screen>
  );
}
