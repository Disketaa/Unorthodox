import { useEffect, useState } from 'preact/hooks';
import { Pace, PublicState } from '@/Game';
import { PlayerId, PlayerLook, CharacterColor, CharacterId, ThemeId } from '@/Core';
import { createSession } from '../SessionFactory';
import { navigate } from '../Routes';
import { Session, SessionRole, BlockedReason, ConnectionHint } from '../Session';
import { useSessionPhase, SessionPhase } from './UseSessionPhase';
import { useGameActions } from './UseGameActions';
import type { GameActions } from './UseGameActions';
import { useRoundClocks } from './UseHostPhaseTimer';
import { useRememberLook } from './UseRememberLook';
import {
  emptyMarks,
  hasSubmittedIn,
  markRejected,
  markSubmitted,
  rejectedIn,
  type RoundMarks,
} from './RoundMarks';

export interface GameSessionView extends SessionPhase {
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
  rejectedGroupIds: ReadonlySet<number>;
  hostLeft: boolean;
  /** Why this player is not in the room, if they are not. */
  blocked: BlockedReason | undefined;
  /** What this device can say about a wait going on too long, if anything yet. */
  connectionHint: ConnectionHint | undefined;
  /** How many players the room holds, which the full-room refusal quotes. */
  roomLimit: number;
  /** The host removing a player from the room. */
  kickPlayer: (playerId: PlayerId) => void;
  /** This player's own character, as the host has it. Not the roll made on this device: a
   * returning player is given the character the host kept, so the picker shows what the rest of
   * the room actually sees. */
  ownLook: PlayerLook | undefined;
  setLook: (character: CharacterId, color: CharacterColor) => void;
  /** Asking for a pace. Only the host's changes the room; a client's is a local look. */
  setPace: (pace: Pace) => void;
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
  nextRound: () => void;
  playAgain: () => void;
  /** Leave the room and go back to the entry screen. */
  exitRoom: () => void;
}

/** This player's own character, once the host has said which one it kept. Nothing before the
 * host has answered: a player with no id yet is not in the roster, so there is no character
 * that the rest of the room is seeing yet. */
function ownLookFor(
  playerId: PlayerId | null,
  looks: ReadonlyMap<PlayerId, PlayerLook>
): PlayerLook | undefined {
  return playerId === null ? undefined : looks.get(playerId);
}

/** Keep the component rendering when the session has news. The session is a plain object with no
 * state of its own, so a re-render is what makes new public state visible; the cleanup stops
 * the session, tearing the transport down. */
function useSessionUpdates(
  session: Session,
  setVersion: (update: (version: number) => number) => void,
  setHostLeft: (value: boolean) => void
): void {
  useEffect(() => {
    session.onUpdate(() => setVersion((version) => version + 1));
    session.onHostLeave(() => setHostLeft(true));
    return () => session.stop();
  }, [session]);
}

/** Leave the room, by going back to the entry route. Navigation is this app's only lever, and
 * leaving the room route unmounts the room, which tears the transport down; calling `stop` here
 * too would clear the roster unread. */
function exitRoom(): void {
  navigate('');
}

/** Read the topic of the phase in view, which identifies the round. */
function readTopic(publicState: PublicState | undefined): string | null {
  return publicState !== undefined && 'topic' in publicState ? publicState.topic : null;
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
  const [marks, setMarks] = useState<RoundMarks>(emptyMarks);
  const actions = useGameActions(
    session,
    publicState,
    roomCode,
    () => setMarks((current) => markSubmitted(current, topic)),
    (groupId) => setMarks((current) => markRejected(current, topic, groupId))
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
  const [, setVersion] = useState(0);
  const [hostLeft, setHostLeft] = useState(false);
  useSessionUpdates(session, setVersion, setHostLeft);

  const publicState = session.getPublicState();
  const phase = useSessionPhase(publicState, session.getClockOffsetMs());
  const topic = readTopic(publicState);
  const { marks, actions } = useRoundMarks(session, publicState, roomCode, topic);
  useRoundClocks(session, role === 'Host', phase, actions);

  const playerId = session.getPlayerId();
  const ownLook = ownLookFor(playerId, phase.playerLooks);
  useRememberLook(ownLook, onLook);

  return {
    ...phase,
    ...actions,
    role,
    isHost: role === 'Host',
    roomCode,
    playerId,
    publicState,
    paused: publicState?.paused === true,
    // Both marks only count while the phase still shows the round they were made in.
    hasSubmitted: hasSubmittedIn(marks, topic),
    rejectedGroupIds: rejectedIn(marks, topic),
    hostLeft,
    blocked: session.getBlocked(),
    connectionHint: session.getConnectionHint(),
    roomLimit: session.getRoomLimit(),
    kickPlayer: (playerId) => session.kick(playerId),
    ownLook,
    exitRoom,
  };
}
