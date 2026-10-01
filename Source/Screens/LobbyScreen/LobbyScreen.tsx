import { Stack } from '@/Design/Primitives';
import {
  CharacterPicker,
  IconButton,
  PlayerChip,
  RoomCodeBadge,
} from '@/Design/Components';
import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { Strings } from '@/Content';
import { GameConfig, PublicPlayer } from '@/Game';
import { LobbyCategory } from './LobbyCategory';
import { LobbyStart } from './LobbyStart';

export interface LobbyScreenProps {
  roomCode: string;
  players: readonly PublicPlayer[];
  /** This device's player, outlined in the roster so it can be found in a full room. */
  ownPlayerId: PlayerId | null;
  /** This player's own name, which titles the character picker. */
  ownPlayerName: string;
  /** This player's own character, once the host has told us which one it kept. */
  ownLook: { character: CharacterId; color: CharacterColor } | undefined;
  isHost: boolean;
  onPickLook: (character: CharacterId, color: CharacterColor) => void;
  onStart: () => void;
  onExit: () => void;
  /** Only the host gets this: the room's way to remove a player. */
  onKick: (playerId: PlayerId) => void;
}

/**
 * The roster, each player drawn as the character the host has them as.
 *
 * Kept apart from the screen itself so the screen stays about arranging parts.
 */
function Roster({
  players,
  ownPlayerId,
  isHost,
  onKick,
}: {
  players: readonly PublicPlayer[];
  ownPlayerId: PlayerId | null;
  isHost: boolean;
  onKick: (playerId: PlayerId) => void;
}) {
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
          isOnline={player.isOnline}
          isSelf={player.id === ownPlayerId}
          // The host cannot remove itself, so its own chip never offers the mark.
          onKick={isHost && player.id !== ownPlayerId ? () => onKick(player.id) : undefined}
          kickLabel={Strings.lobby.kick(player.name)}
        />
      ))}
    </Stack>
  );
}

/**
 * The picker for this player's own character.
 *
 * In a card, so the whole editing area reads as one thing against the roster
 * above and the start button below. Titled with the player's own name, which is what
 * the rest of the room calls them: a card headed by their name reads as their sheet
 * of paper rather than as a settings panel. Hidden until the host has said which
 * character it kept for us, so the picker never shows a character that the rest of
 * the room is not seeing.
 */
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
        }}
        onPick={onPick}
      />
    </LobbyCategory>
  );
}

/**
 * Whether the room is ready to start, and whether it is already full.
 *
 * Counted from the players who are actually here: a seat whose owner has dropped
 * is still on the roster, but starting a round would wait on an answer that can no
 * longer arrive, so a room of one live player is a room of one.
 */
function readiness(players: readonly PublicPlayer[]): {
  enoughPlayers: boolean;
  roomFull: boolean;
} {
  const hereCount = players.filter((player) => player.isOnline).length;
  return {
    enoughPlayers: hereCount >= GameConfig.limits.minPlayers,
    roomFull: players.length >= GameConfig.limits.maxPlayers,
  };
}

/** The room itself: its code, who is in it, and the way to start or wait. */
function Room({
  roomCode,
  players,
  ownPlayerId,
  isHost,
  onPickStart,
  onKick,
  onExit,
}: Pick<
  LobbyScreenProps,
  'roomCode' | 'players' | 'ownPlayerId' | 'isHost' | 'onKick' | 'onExit'
> & { onPickStart: () => void }) {
  const { enoughPlayers, roomFull } = readiness(players);
  return (
    <LobbyCategory
      title={<RoomCodeBadge code={roomCode} />}
      action={<IconButton icon="Exit" label={Strings.lobby.exit} onClick={onExit} />}
    >
      <Roster players={players} ownPlayerId={ownPlayerId} isHost={isHost} onKick={onKick} />
      <LobbyStart
        enoughPlayers={enoughPlayers}
        roomFull={roomFull}
        isHost={isHost}
        onStart={onPickStart}
      />
    </LobbyCategory>
  );
}

/** Waiting room: the room code, the roster, and the character picker. */
export function LobbyScreen({
  roomCode,
  players,
  ownPlayerId,
  ownPlayerName,
  ownLook,
  isHost,
  onPickLook,
  onStart,
  onExit,
  onKick,
}: LobbyScreenProps) {
  return (
    <Stack gap="Lg" align="Stretch">
      <Room
        roomCode={roomCode}
        players={players}
        ownPlayerId={ownPlayerId}
        isHost={isHost}
        onPickStart={onStart}
        onKick={onKick}
        onExit={onExit}
      />
      {ownLook !== undefined && (
        <LookPicker
          ownName={ownPlayerName}
          ownLook={ownLook}
          onPick={onPickLook}
        />
      )}
    </Stack>
  );
}
