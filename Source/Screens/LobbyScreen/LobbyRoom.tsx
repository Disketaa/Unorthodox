import { Banner, Button, IconButton, RoomCodeBadge } from '@/Design/Components';
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
  /** Whether the host has turned the console on, which is what brings the tools. */
  debugEnabled: boolean;
  onStart: () => void;
  onExit: () => void;
  /** Only the host gets this: the room's way to remove a player. */
  onKick: (playerId: PlayerId) => void;
  /** Only the host gets this, and only while the console is on: put a player in. */
  onAddBot: () => void;
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

/**
 * What the console is for, and one of the things it is for: the note that says
 * logging is on.
 *
 * Nothing at all when the flag is off, which is the whole of the host's guarantee
 * that nobody else ever sees this.
 */
function DebugNote({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <Banner variant="Accent" mark="Info">
      {Strings.lobby.debugOn}
    </Banner>
  );
}

/**
 * The way to put an invented player in the room, under the rule that names the list.
 *
 * The button goes with the last seat, on the same rule as Start: a control that would
 * do nothing is not shown disabled.
 */
function AddBotButton({
  enabled,
  roomFull,
  onAddBot,
}: {
  enabled: boolean;
  roomFull: boolean;
  onAddBot: () => void;
}) {
  if (!enabled || roomFull) return null;
  return (
    <Button variant="Primary" onClick={onAddBot}>
      {Strings.lobby.addBot}
    </Button>
  );
}

/** The room itself: its code, who is in it, and the way to start or wait. */
export function LobbyRoom({
  roomCode,
  players,
  ownPlayerId,
  isHost,
  debugEnabled,
  onStart,
  onExit,
  onKick,
  onAddBot,
}: LobbyRoomProps) {
  const { enoughPlayers, roomFull } = readiness(players);
  return (
    <LobbyCategory
      title={<RoomCodeBadge code={roomCode} />}
      action={<IconButton icon="Exit" label={Strings.lobby.exit} onClick={onExit} />}
    >
      <LobbyRoster
        players={players}
        ownPlayerId={ownPlayerId}
        isHost={isHost}
        onKick={onKick}
        addBot={<AddBotButton enabled={debugEnabled} roomFull={roomFull} onAddBot={onAddBot} />}
      />
      <LobbyStart
        enoughPlayers={enoughPlayers}
        roomFull={roomFull}
        isHost={isHost}
        note={<DebugNote enabled={debugEnabled} />}
        onStart={onStart}
      />
    </LobbyCategory>
  );
}
