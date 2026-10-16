import { useEffect, useState } from 'preact/hooks';
import { Pace, PublicState } from '@/Game';
import {
  PlayerId,
  PlayerLook,
  CharacterColor,
  CharacterId,
  ThemeId,
  CustomTheme,
} from '@/Core';
import type { ThemeMode } from '@/Core';
import { createSession } from '../SessionFactory';
import { Session, SessionRole, BlockedReason, ConnectionHint } from '../Session';
import { useSessionPhase, SessionPhase } from './UseSessionPhase';
import { useGameActions, type GameActions } from './UseGameActions';
import { useRoundClocks } from './UseHostPhaseTimer';
import {
  emptyMarks,
  hasSubmittedIn,
  markLiked,
  markSubmitted,
  type RoundMarks,
} from './RoundMarks';
import { boardMarks, type BoardMarks } from './BoardMarks';
import { loadMarks, saveMarks } from './MarksStorage';
import { useSessionUpdates } from './UseSessionUpdates';
import { useLocalFlags } from './UseLocalFlags';
import { useOwnLook } from './UseOwnLook';
import { exitRoom, readTopic, reportEditing } from './SessionUtils';

/** Everything a screen is drawn from: the phase in view, the moves it can make, and what a board
 * of answers is showing РІР‚— the host's mutes, the room's like counts, which of those were
 * this player's own presses, and whether they wrote an answer at all. */
export interface GameSessionView extends SessionPhase, BoardMarks {
  role: SessionRole;
  isHost: boolean;
  roomCode: string;
  playerId: PlayerId | null;
  publicState: PublicState | undefined;
  /** Whether the host is holding the room still, which stops every clock and every answer in it.
   * Read from the room rather than kept here, since a screen that guessed for itself would be
   * the one screen in the room still playing. */
  paused: boolean;
  hasSubmitted: boolean;
  /** Whether this player is writing over an answer they already sent, which puts them back at
   * work in the bar. Held here as well as sent, so their own seat does not wait on the round
   * trip. */
  editing: boolean;
  setEditing: (editing: boolean) => void;
  hostLeft: boolean;
  /** Why this player is not in the room, if they are not. */
  blocked: BlockedReason | undefined;
  /** What this device can say about a wait going on too long, if anything yet. */
  connectionHint: ConnectionHint | undefined;
  /** How many players the room holds, which the full-room refusal quotes. */
  roomLimit: number;
  /** The custom themes this room knows, so every screen can draw them in the bank. */
  customThemes: readonly CustomTheme[];
  /** The host removing a player from the room. */
  kickPlayer: (playerId: PlayerId) => void;
  /** This player's own character, as the host has it. Not the roll made on this device: a
   * returning player is given the character the host kept, so the picker shows what the rest of
   * the room actually sees. */
  ownLook: PlayerLook | undefined;
  setLook: (character: CharacterId, color: CharacterColor) => void;
  /** Asking for a pace or for the room's themes: both the host's alone. */
  setPace: (pace: Pace) => void;
  setThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  /** The host pasting in custom themes, which every client is then told. */
  setCustomThemes: (themes: readonly CustomTheme[]) => void;
  /** The host striking one custom theme out of the room and out of this browser. */
  removeCustomTheme: (name: string) => void;
  /** Holding the room still, or letting it run again. */
  setPaused: (paused: boolean) => void;
  /** Put an invented player in the room. Only the host's, and only while debugging. */
  addBot: () => void;
  /** Hand the room's turn to the next player. Only the host's, and only while debugging. */
  nextTurn: () => void;
  startGame: () => void;
  /** Answering the theme bank on this player's behalf. The room sees the answer, not the player. */
  chooseTheme: (theme: ThemeId) => void;
  nextPhase: () => void;
  submitAnswer: (text: string) => void;
  rejectGroup: (groupId: number) => void;
  likeGroup: (groupId: number) => void;
  nextRound: () => void;
  playAgain: () => void;
  /** Leave the room and go back to the entry screen. */
  exitRoom: () => void;
}

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
  const phase = useSessionPhase(publicState, session.getClockOffsetMs());
  const topic = readTopic(publicState);
  const { marks, actions } = useRoundMarks(session, publicState, roomCode, topic);
  useRoundClocks(session, role === 'Host', phase, actions);
  const ownLook = useOwnLook(session, phase.playerLooks, onLook);
  return {
    ...phase,
    ...actions,
    role,
    isHost: role === 'Host',
    roomCode,
    playerId: session.getPlayerId(),
    publicState,
    paused: publicState?.paused === true,
    // Both marks only count while the phase still shows the round they were made in.
    hasSubmitted: hasSubmittedIn(marks, topic),
    editing,
    ...boardMarks(publicState, marks, topic),
    setEditing: reportEditing(markEditing, actions.setEditingAnswer),
    hostLeft,
    blocked: session.getBlocked(),
    connectionHint: session.getConnectionHint(),
    roomLimit: session.getRoomLimit(),
    customThemes: session.getCustomThemes(),
    kickPlayer: (playerId) => session.kick(playerId),
    ownLook,
    exitRoom,
    setCustomThemes: (themes) => session.setCustomThemes?.(themes),
    removeCustomTheme: (name) => session.removeCustomTheme?.(name),
  };
}
