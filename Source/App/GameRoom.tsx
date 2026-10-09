import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  InfoScreen,
  LobbyDebugTools,
  PauseDebugTools,
  PhaseDebugTools,
  TurnDebugTools,
} from '@/Screens';
import { Strings } from '@/Content';
import { PlayerLook, assertNever } from '@/Core';
import { DebugDock, PausedRoom, StartCountdown } from '@/Design/Overlays';
import { useGameSession } from './Hooks/UseGameSession';
import { useDebugToggle } from './Hooks/UseDebugToggle';
import { useStartCountdown } from './Hooks/UseStartCountdown';
import type { GameSessionView } from './Hooks/UseGameSession';
import type { SessionPhaseName } from './Hooks/UseSessionPhase';
import { SessionRole, BlockedReason } from './Session';
import { LobbyView } from './Views/LobbyView';
import { GameScene, WritingScene } from './Views/GameScene';

export interface GameRoomProps {
  roomCode: string;
  role: SessionRole;
  name: string;
  /** The character this device joins with, the last one it wore or a fresh roll. */
  look: PlayerLook;
  /** Reports the character the host kept, so the next room in this tab starts from it. */
  onLook: (look: PlayerLook) => void;
}

/** The one sentence for each way a player can find themselves outside the room. A function
 * rather than a table because one of the four carries a number, and the number is the host's
 * rather than one written here. */
function blockedMessage(reason: BlockedReason, roomLimit: number): string {
  switch (reason) {
    case 'NameTaken':
      return Strings.status.nameTaken;
    case 'AlreadyStarted':
      return Strings.status.alreadyStarted;
    case 'RoomFull':
      return Strings.status.roomFull(roomLimit);
    case 'Kicked':
      return Strings.status.kicked;
    default:
      return assertNever(reason);
  }
}

/** Still reaching the host, or failing to. An ordinary wait is the loading screen. Once it has
 * outlasted that the wait is over — no room that cannot be found is found by waiting — so the
 * screen becomes the verdict instead, on the error fill and the reporting mark. */
function ConnectingScreen({ view }: { view: GameSessionView }) {
  const failure =
    view.connectionHint === 'clockUnchecked'
      ? Strings.status.clockUnchecked
      : view.connectionHint === 'noPeers'
        ? Strings.status.stillLooking
        : undefined;
  if (failure !== undefined) {
    return (
      <InfoScreen
        message={failure}
        variant="Error"
        action={Strings.common.cancel}
        onAcknowledge={view.exitRoom}
      />
    );
  }
  return (
    <InfoScreen
      message={Strings.status.connecting}
      mark="Loading"
      action={Strings.common.cancel}
      onAcknowledge={view.exitRoom}
    />
  );
}

/** The screen each phase plays on, as a row per phase. The lobby is the only one that is not the
 * game stage: the stage is a room already playing, with nothing left to set up. */
const PhaseScreens: Record<
  SessionPhaseName,
  (props: { view: GameSessionView }) => ComponentChildren
> = {
  Connecting: ConnectingScreen,
  Lobby: LobbyView,
  Choosing: GameScene,
  Writing: WritingScene,
  Reviewing: GameScene,
  Scores: GameScene,
  Final: GameScene,
};

/** Pick the screen that matches the current phase. */
function PhaseScreen({ view }: { view: GameSessionView }) {
  // Both of these end the session as far as this player is concerned, so both send
  // them back to the entry screen rather than leaving them on a dead room.
  if (view.hostLeft) {
    return <InfoScreen message={Strings.status.hostLeft} onAcknowledge={view.exitRoom} />;
  }
  if (view.blocked !== undefined) {
    return (
      <InfoScreen
        message={blockedMessage(view.blocked, view.roomLimit)}
        onAcknowledge={view.exitRoom}
      />
    );
  }
  const Screen = PhaseScreens[view.phase];
  return <Screen view={view} />;
}

/** The room, and the host's dock under it. The dock is mounted here rather than by any screen,
 * because it outlives them: the "" that opens it belongs to the host rather than to a phase. */
export function GameRoom({ roomCode, role, name, look, onLook }: GameRoomProps) {
  const view = useGameSession(roomCode, role, name, look, onLook);
  const { debugEnabled } = useDebugToggle(view.isHost);
  return <CountedRoom view={view} roomCode={roomCode} debugEnabled={debugEnabled} />;
}

interface CountedRoomProps {
  view: GameSessionView;
  roomCode: string;
  debugEnabled: boolean;
}

/** The room as it is being counted in to. The screen under the shade is the lobby they pressed
 * Start on: the theme cards would otherwise arrive under the numbers in the same frame as the
 * press, so the count would be counting over a screen nobody has looked at yet. */
function CountedRoom({ view, roomCode, debugEnabled }: CountedRoomProps) {
  const { veiling, count } = useStartCountdown(view, roomCode);
  const counting = veiling || count !== null;
  // The last lobby seen, which is the screen the count belongs over. Set while rendering, so the
  // frame the room leaves the lobby on still has it: by the time an effect ran, it would be gone.
  const [lobby, setLobby] = useState<GameSessionView | null>(null);
  if (view.phase === 'Lobby') {
    setLobby(view);
  }

  return (
    <>
      {counting && <StartCountdown veiling={veiling} count={count} />}
      {view.paused && <PausedRoom label={Strings.pause.held} />}
      <PhaseScreen view={counting && lobby !== null ? lobby : view} />
      {!counting && (
        <DebugDock enabled={debugEnabled}>
          {view.isHost && (
            <>
              <LobbyDebugTools publicState={view.publicState} onAddBot={view.addBot} />
              <TurnDebugTools publicState={view.publicState} onNextTurn={view.nextTurn} />
              <PauseDebugTools paused={view.paused} onSetPaused={view.setPaused} />
              <PhaseDebugTools publicState={view.publicState} onNextPhase={view.nextPhase} />
            </>
          )}
        </DebugDock>
      )}
    </>
  );
}
