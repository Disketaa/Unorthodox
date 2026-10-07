import { IconButton, RoomCodeBadge } from '@/Design/Components';
import { PlayerId } from '@/Core';
import { GameConfig, PublicPlayer } from '@/Game';
import { Strings } from '@/Content';
import { LobbyCategory } from './LobbyCategory';
import { LobbyRoster } from './LobbyRoster';
import { LobbyStart } from './LobbyStart';

export interface LobbyRoomProps {
  roomCode: string;
  players: readonly PublicPlayer[];
  /** This device's player, outlined in the roster so it can be found in a full room. */
  ownPlayerId: PlayerId | null;
  isHost: boolean;
  onStart: () => void;
  onExit: () => void;
  /** Only the host gets this: the room's way to remove a player. */
  onKick: (playerId: PlayerId) => void;
}

/** Whether the room is ready to start, and whether it is already full. Counted from the players
 * actually here: a seat whose owner has dropped is still on the roster, but starting would wait
 * on an answer that can no longer arrive, so a room of one live player is one. */
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

/** Whether there is a seat left for one more player. Exported because the host's dock asks the
 * same question about its own button, and two answers to "is the room full" is one more than
 * this screen should have. */
export function hasRoomFor(players: readonly PublicPlayer[]): boolean {
  return players.length < GameConfig.limits.maxPlayers;
}

/** The room itself: its code, who is in it, and the way to start or wait. */
export function LobbyRoom({
  roomCode,
  players,
  ownPlayerId,
  isHost,
  onStart,
  onExit,
  onKick,
}: LobbyRoomProps) {
  const { enoughPlayers, roomFull } = readiness(players);
  return (
    <LobbyCategory
      title={<RoomCodeBadge code={roomCode} />}
      action={<IconButton icon="Exit" label={Strings.lobby.exit} onClick={onExit} />}
    >
      {/* Start sits above the roster, not under it: the roster grows as players join, and a
       * control that slides down with them is a control the host has to hunt for. */}
      <LobbyStart
        enoughPlayers={enoughPlayers}
        roomFull={roomFull}
        isHost={isHost}
        onStart={onStart}
      />
      <LobbyRoster
        players={players}
        ownPlayerId={ownPlayerId}
        isHost={isHost}
        onKick={onKick}
      />
    </LobbyCategory>
  );
}
