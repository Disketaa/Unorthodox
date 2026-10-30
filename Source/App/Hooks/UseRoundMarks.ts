import { useEffect, useState } from 'preact/hooks';
import { PublicState } from '@/Game';
import { RoundMarks, emptyMarks, markLiked, markSubmitted } from './RoundMarks';
import { useGameActions } from './UseGameActions';
import { loadMarks, saveMarks } from './MarksStorage';
import { Session } from '../Session';

/** The marks this player has made in a round, and the actions that make them. Each mark is
 * stamped with the round it was made in, which is why this holds state at all: a player shown
 * the next round must stop counting as having answered. */
export function useRoundMarks(
  session: Session,
  publicState: PublicState | undefined,
  roomCode: string,
  topic: string | null
): { marks: RoundMarks; actions: ReturnType<typeof useGameActions> } {
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
