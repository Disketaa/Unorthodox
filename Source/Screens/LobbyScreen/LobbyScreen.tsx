import { Stack, Text } from '@/Design/Primitives';
import {
  Card,
  CharacterPicker,
  PlayerChip,
  RoomCodeBadge,
} from '@/Design/Components';
import { CharacterColor, CharacterId } from '@/Core';
import { Strings } from '@/Content';
import { GameConfig, PublicPlayer } from '@/Game';
import { LobbyStart } from './LobbyStart';

export interface LobbyScreenProps {
  roomCode: string;
  players: readonly PublicPlayer[];
  /** This player's own character, once the host has told us which one it kept. */
  ownLook: { character: CharacterId; color: CharacterColor } | undefined;
  isHost: boolean;
  onPickLook: (character: CharacterId, color: CharacterColor) => void;
  onStart: () => void;
}

/**
 * The roster, each player drawn as the character the host has them as.
 *
 * Kept apart from the screen itself so the screen stays about arranging parts.
 */
function Roster({ players }: { players: readonly PublicPlayer[] }) {
  return (
    <Stack gap="Sm">
      {players.map((player, index) => (
        <PlayerChip
          key={player.id}
          name={player.name}
          character={player.look.character}
          color={player.look.color}
          index={index}
          isHost={index === 0}
        />
      ))}
    </Stack>
  );
}

/**
 * The picker for this player's own character.
 *
 * In a card, so the whole editing area reads as one thing against the roster
 * above and the start button below. Hidden until the host has said which
 * character it kept for us, so the picker never shows a character that the rest
 * of the room is not seeing.
 */
function LookPicker({
  ownLook,
  onPick,
}: {
  ownLook: { character: CharacterId; color: CharacterColor };
  onPick: (character: CharacterId, color: CharacterColor) => void;
}) {
  return (
    <Card variant="Elevated">
      <Stack gap="Sm" align="Stretch">
        <Text variant="Title">{Strings.lobby.characterHeading}</Text>
        <Text variant="Caption">{Strings.lobby.characterHint}</Text>
        <CharacterPicker
          character={ownLook.character}
          color={ownLook.color}
          labels={{
            character: Strings.characters.names,
            color: Strings.characters.colors,
            pickCharacter: Strings.characters.pickCharacter,
          }}
          onPick={onPick}
        />
      </Stack>
    </Card>
  );
}

/** Waiting room: the room code, the roster, and the character picker. */
export function LobbyScreen({
  roomCode,
  players,
  ownLook,
  isHost,
  onPickLook,
  onStart,
}: LobbyScreenProps) {
  const enoughPlayers = players.length >= GameConfig.limits.minPlayers;
  const roomFull = players.length >= GameConfig.limits.maxPlayers;

  return (
    <Stack gap="Lg" align="Stretch">
      <RoomCodeBadge code={roomCode} />
      <Text variant="Body">{Strings.lobby.shareHint}</Text>
      <Roster players={players} />
      {ownLook !== undefined && (
        <LookPicker ownLook={ownLook} onPick={onPickLook} />
      )}
      <LobbyStart
        enoughPlayers={enoughPlayers}
        roomFull={roomFull}
        isHost={isHost}
        onStart={onStart}
      />
    </Stack>
  );
}
