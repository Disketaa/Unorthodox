import { Button } from '@/Design/Components';
import { PublicState } from '@/Game';
import { Strings } from '@/Content';

export interface PhaseDebugToolsProps {
  publicState: PublicState | undefined;
  onNextPhase: () => void;
}

/** Steps the room along the phase table by hand, so every phase can be checked without waiting
 * out any of them. Shown only once the host has said which phase the room is in, and never in
 * the lobby, which is where the session starts rather than a phase it steps out of. */
export function PhaseDebugTools({ publicState, onNextPhase }: PhaseDebugToolsProps) {
  if (publicState === undefined || publicState.phase === 'Lobby') {
    return null;
  }
  return (
    <Button variant="Primary" size="Small" onClick={onNextPhase}>
      {Strings.turn.nextPhase}
    </Button>
  );
}
