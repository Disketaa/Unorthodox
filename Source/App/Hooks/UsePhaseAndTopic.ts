import { PublicState } from '@/Game';
import { Session } from '../Session';
import { useSessionPhase } from './UseSessionPhase';
import { readTopic } from './SessionUtils';

/** The phase this room is in and the topic it is on, both read from the public state. */
export function usePhaseAndTopic(
  session: Session,
  publicState: PublicState | undefined
): { phase: ReturnType<typeof useSessionPhase>; topic: string | null } {
  const phase = useSessionPhase(publicState, session.getClockOffsetMs());
  const topic = readTopic(publicState);
  return { phase, topic };
}
