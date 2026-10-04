import { useState } from 'preact/hooks';
import { InfoScreen, LobbyDebugTools } from '@/Screens';
import { Strings } from '@/Content';
import { PlayerLook, assertNever } from '@/Core';
import { Stack, ViewportCenter } from '@/Design/Primitives';
import { DebugDock, StartCountdown } from '@/Design/Overlays';
import { useGameSession } from './Hooks/UseGameSession';
import { useDebugToggle } from './Hooks/UseDebugToggle';
import { useStartCountdown } from './Hooks/UseStartCountdown';
import type { GameSessionView } from './Hooks/UseGameSession';
import { SessionRole, BlockedReason } from './Session';
import { LobbyView } from './Views/LobbyView';
import { PhaseInfoView } from './Views/PhaseInfoView';
import { PlayerCardView } from './Views/PlayerCardView';
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

/**
 * The one sentence for each way a player can find themselves outside the room.
 *
 * A function rather than a table because one of the four carries a number, and
 * the number is the host's rather than one written here: a refusal quoting a
 * different limit from the room's would be a number the player could not argue
 * with.
 */
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

/**
 * The stage the game plays on: a note at the top with this player's own card
 * under it, and the bank of themes under both.
 *
 * A `Stack` filling the height rather than a `Screen`, and the difference is
 * the bank. A `Screen` is a grid of fixed-width containers, which is right for
 * a page of cards and wrong here: it caps every row at one readable column, so
 * the bank of six was laid out inside a 480px track and the cards came out
 * narrow and against one side.
 *
 * The note and this player's own card stand together at the top, and the bank
 * is centred under them, because they answer three different questions. The
 * note says what the room is doing, the bank is the thing being done and the
 * card says where this player stands, so the middle of the screen belongs to
 * the thing being looked at.
 *
 * The two are one stack rather than two rows because they are both about this
 * player: what is happening to them, and where they stand in it. A note at the
 * top of the screen and a card at the bottom of it are two things to look for,
 * and the second one is the one a player glances at in the middle of a round.
 * The gap between them is the connecting screen's, so the block and whatever
 * sits under it are one step apart wherever in the game that happens to be.
 *
 * Both are centred on the same line rather than filling the width: a note and a
 * card stretched across a screen say they are sections of something, and one of
 * them is a sentence and the other is a face.
 *
 * The bank is wrapped in `ViewportCenter` rather than centred with
 * `justify-content`, and that is the whole of the difference between "in the
 * middle of the screen" and "in the middle of what the note left". The frame
 * measures the height above itself and gives half of it back, so the bank stays
 * in the middle of the viewport however many things sit at the top of the game
 * and however tall they are.
 *
 * The row clips rather than scrolling, so the game is one screen rather than a
 * page — a screen a player is looking at should not have to be scrolled to see
 * half of what it is offering.
 *
 * The four phase screens that used to stand here are still in `Screens/`,
 * unmounted, and `PhaseScreen` chooses this for every phase after the lobby —
 * so the theme bank is on screen for writing and reviewing too. It is the first
 * phase's cards showing through the whole game, which is what a phase that has
 * no rule yet looks like from the outside.
 */
function GameScene({ view }: { view: GameSessionView }) {
  return (
    <Stack align="Center" gap="Md" grow clip>
      <Stack gap="Md" align="Center">
        <PhaseInfoView view={view} />
        <PlayerCardView view={view} />
      </Stack>
      <ViewportCenter>
        <ThemeCardsView roomCode={view.roomCode} />
      </ViewportCenter>
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
      // The same screen as the failures, because it is the same situation seen a
      // moment earlier. The mark and the button both change: the mark says it is
      // still waiting rather than that something is wrong, and the button gives
      // up on the wait rather than acknowledging a fact.
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

/**
 * The room, and the host's dock under it.
 *
 * The dock is mounted here rather than by any screen, because it outlives them:
 * the "*" that opens it belongs to the host rather than to a phase, and the
 * controls in it are whatever the screen on top happens to offer — the lobby
 * can add a player and nothing else can, so every other phase shows the note
 * with no controls beside it.
 *
 * So is the count-in, for the same reason: it belongs to the moment the host
 * pressed Start rather than to the screen that came up afterwards, and it is
 * counted on each device's own clock, so a device that heard about the game
 * late still gets all three numbers rather than joining the count wherever the
 * room already was.
 */
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

/**
 * The room as it is being counted in to.
 *
 * The screen underneath the shade is the lobby, held there until the count is
 * over. Not the screen the room has moved to: the writing screen would appear
 * underneath the numbers the instant they started, which is the button's press
 * taking the lobby away in the same frame as the press itself. Held instead,
 * the lobby dims under the shade the room is still sitting in, and the writing
 * screen arrives when the count runs out, on the page's own fade.
 *
 * Held by keeping the view rather than the phase name, because a view is what
 * the screen was actually drawn from: the roster, the pace and the characters
 * in it only reach a client while the room is a lobby, and a name would have to
 * be resolved back into one of those afterwards, by which time the state behind
 * it is gone.
 *
 * A client that walked into the room mid-count has no lobby to hold, and is
 * shown the screen it has rather than an empty one.
 */
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
            <LobbyDebugTools publicState={view.publicState} onAddBot={view.addBot} />
          )}
        </DebugDock>
      )}
    </>
  );
}
