import { useEffect, useMemo, useState } from 'preact/hooks';
import { GameConfig, PublicState } from '@/Game';
import { PlayerId, PlayerLook, ThemeId, CustomTheme, themePool, themesForRoom } from '@/Core';
import { createSession } from '../SessionFactory';
import { Session, SessionRole } from '../Session';
import { useSessionPhase } from './UseSessionPhase';
import { useGameActions, type GameActions } from './UseGameActions';
import { useRoundClocks } from './UseHostPhaseTimer';
import {
  emptyMarks,
  hasSubmittedIn,
  markLiked,
  markSubmitted,
  type RoundMarks,
} from './RoundMarks';
import { boardMarks } from './BoardMarks';
import { loadMarks, saveMarks } from './MarksStorage';
import { useSessionUpdates } from './UseSessionUpdates';
import { useLocalFlags } from './UseLocalFlags';
import { useOwnLook } from './UseOwnLook';
import { usePerfPhase } from './UsePerfPhase';
import { exitRoom, readTopic, reportEditing } from './SessionUtils';
import { GameSessionView } from './GameSessionView';

export type { GameSessionView } from './GameSessionView';

/** The marks this player has made in a round, and the actions that make them. Each mark is
 * stamped with the round it was made in, which is why this holds state at all: a player shown
 * the next round must stop counting as having answered. */
function useRoundMarks(
  session: Session,
  publicState: PublicState | undefined,
  roomCode: string,
  topic: string | null
): { marks: RoundMarks; actions: GameActions } {
  // Seeded from the room's storage, since the count survives a refresh on its own and this is
  // the half only this browser knows: which of those likes were its own.
  const [marks, setMarks] = useState<RoundMarks>(() => loadMarks(roomCode) ?? emptyMarks());
  useEffect(() => saveMarks(roomCode, marks), [roomCode, marks]);
  const actions = useGameActions(
    session,
    publicState,
    roomCode,
    (text) => setMarks((current) => markSubmitted(current, topic, text)),
    (groupId) => setMarks((current) => markLiked(current, topic, groupId))
  );
  return { marks, actions };
}

/** The phase this room is in and the topic it is on, both read from the public state. */
function usePhaseAndTopic(
  session: Session,
  publicState: PublicState | undefined
): { phase: ReturnType<typeof useSessionPhase>; topic: string | null } {
  const phase = useSessionPhase(publicState, session.getClockOffsetMs());
  const topic = readTopic(publicState);
  return { phase, topic };
}

/** The player's own look as the host has it, and the bank this screen and the enchantment roll
 * both read. Out of the room's own pool and its code, so every screen holds the same six. */
function useOwnLookAndBank(
  session: Session,
  phase: ReturnType<typeof useSessionPhase>,
  onLook: (look: PlayerLook) => void,
  roomCode: string,
  publicState: PublicState | undefined
): { ownLook: PlayerLook | undefined; bank: readonly ThemeId[] } {
  const ownLook = useOwnLook(session, phase.playerLooks, onLook);
  const bank = useMemo(
    () =>
      themesForRoom(
        roomCode,
        GameConfig.themes.cardsPerLobby,
        themePool(
          publicState?.themeMode ?? 'Random',
          publicState?.themes ?? [],
          session.getCustomThemes()
        )
      ),
    [roomCode, publicState?.themeMode, publicState?.themes, session, publicState]
  );
  return { ownLook, bank };
}

/** Actions that delegate to the session: kick, set custom themes, remove a custom theme. */
function sessionActions(session: Session) {
  return {
    kickPlayer: (playerId: PlayerId) => session.kick(playerId),
    setCustomThemes: (themes: readonly CustomTheme[]) => session.setCustomThemes?.(themes),
    removeCustomTheme: (name: string) => session.removeCustomTheme?.(name),
  };
}

/** Let the performance run step the room into a hidden phase, such as the winning show, through
 * the host's console jump. Off unless the perf sink is installed, and the host owns the jump. */
function exposePerfJump(session: Session): void {
  const perfWindow = window as unknown as {
    __perf?: unknown;
    __perfJump?: (phase: PhaseName) => void;
  };
  if (!import.meta.env.DEV || perfWindow.__perf === undefined) return;
  if (session.jumpToPhase === undefined) return;
  perfWindow.__perfJump = session.jumpToPhase;
}

/** Join a room and expose one uniform view of the game for the screens. */
export function useGameSession(
  roomCode: string,
  role: SessionRole,
  playerName: string,
  look: PlayerLook,
  onLook: (look: PlayerLook) => void
): GameSessionView {
  const [session] = useState<Session>(() => createSession(role, roomCode, playerName, look));
  const { hostLeft, editing, bump, setHostLeft, markEditing } = useLocalFlags();
  useSessionUpdates(session, bump, setHostLeft);
  const publicState = session.getPublicState();
  const { phase, topic } = usePhaseAndTopic(session, publicState);
  usePerfPhase(phase.phase);
  exposePerfJump(session);
  const { marks, actions } = useRoundMarks(session, publicState, roomCode, topic);
  useRoundClocks(session, role === 'Host', phase, actions);
  const { ownLook, bank } = useOwnLookAndBank(session, phase, onLook, roomCode, publicState);
  return {
    ...phase,
    ...actions,
    role,
    isHost: role === 'Host',
    roomCode,
    playerId: session.getPlayerId(),
    publicState,
    paused: publicState?.paused === true,
    hasSubmitted: hasSubmittedIn(marks, topic),
    editing,
    ...boardMarks(publicState, marks, topic),
    setEditing: reportEditing(markEditing, actions.setEditingAnswer),
    hostLeft,
    blocked: session.getBlocked(),
    connectionHint: session.getConnectionHint(),
    roomLimit: session.getRoomLimit(),
    customThemes: session.getCustomThemes(),
    bank,
    ownLook,
    exitRoom,
    ...sessionActions(session),
  };
}
