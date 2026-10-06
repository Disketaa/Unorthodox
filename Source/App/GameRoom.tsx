import { useState } from 'preact/hooks';
import { InfoScreen, LobbyDebugTools, TurnDebugTools } from '@/Screens';
import { Strings } from '@/Content';
import { PlayerLook, assertNever } from '@/Core';
import { Stack } from '@/Design/Primitives';
import { DebugDock, StartCountdown } from '@/Design/Overlays';
import { useGameSession } from './Hooks/UseGameSession';
import { useDebugToggle } from './Hooks/UseDebugToggle';
import { useStartCountdown } from './Hooks/UseStartCountdown';
import type { GameSessionView } from './Hooks/UseGameSession';
import { SessionRole, BlockedReason } from './Session';
import { LobbyView } from './Views/LobbyView';
import { PhaseInfoView } from './Views/PhaseInfoView';
import { PlayerBarView } from './Views/PlayerBarView';
import { ThemeCardsView } from './Views/ThemeCardsView';

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

/** The stage the game plays on: what the room is doing at the very top, the room's hexes under
 * it, and the themes below. The bank sits under the note rather than in the middle of what is
 * left: it was measured against the viewport, so it moved as the note above it changed height. */
function GameScene({ view }: { view: GameSessionView }) {
  return (
    <Stack align="Center" gap="Md" grow clip>
      <Stack gap="Md" align="Center">
        <PhaseInfoView view={view} />
        <PlayerBarView view={view} />
      </Stack>
      <ThemeCardsView roomCode={view.roomCode} />
    </Stack>
  );
}

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
  switch (view.phase) {
    case 'Lobby':
      return <LobbyView view={view} />;
    case 'Writing':
    case 'Reviewing':
    case 'Scores':
    case 'Final':
      return <GameScene view={view} />;
    default:
      // The same screen as the failures, because it is the same situation seen a moment earlier.
      // The mark and the button both change: the mark says it is still waiting rather than that
      // something is wrong, and the button gives up on the wait rather than acknowledging a fact.
      return (
        <InfoScreen
          message={Strings.status.connecting}
          mark="Loading"
          action={Strings.common.cancel}
          onAcknowledge={view.exitRoom}
        />
      );
  }
}

/** The room, and the host's dock under it. The dock is mounted here rather than by any screen,
 * because it outlives them: the "*" that opens it belongs to the host rather than to a phase. */
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

/** The room as it is being counted in to. The screen under the shade is the lobby held until the
 * count is over, not the screen the room has moved to, which would appear under the numbers in
 * the same frame as the press. */
function CountedRoom({ view, roomCode, debugEnabled }: CountedRoomProps) {
  const { veiling, count } = useStartCountdown(view, roomCode);
  const counting = veiling || count !== null;
  // Kept while the room is being counted in to, and dropped the moment it is not, so
  // the lobby is what the shade is over rather than the screen the room has already
  // moved on to.
  const [held, setHeld] = useState<GameSessionView | null>(null);
  if (counting && held === null) {
    setHeld(view);
  }
  if (!counting && view.phase === 'Lobby') {
    setHeld(view);
  }

  return (
    <>
      {counting && <StartCountdown veiling={veiling} count={count} />}
      <PhaseScreen view={counting && held !== null ? held : view} />
      {!counting && (
        <DebugDock enabled={debugEnabled} label={Strings.lobby.debugOn}>
          {view.isHost && (
            <>
              <LobbyDebugTools publicState={view.publicState} onAddBot={view.addBot} />
              <TurnDebugTools publicState={view.publicState} onNextTurn={view.nextTurn} />
            </>
          )}
        </DebugDock>
      )}
    </>
  );
}
