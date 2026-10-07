import { Button } from '@/Design/Components';
import { PublicState } from '@/Game';
import { Strings } from '@/Content';

export interface PhaseDebugToolsProps {
  publicState: PublicState | undefined;
  onNextPhase: () => void;
}

/** The host's way of stepping the room along the phase table by hand, so a walk through every
 * phase can be checked without waiting out any of them. Shown only once the host has said which
 * phase the room is in: before that there is no phase to step out of. */
export function PhaseDebugTools({ publicState, onNextPhase }: PhaseDebugToolsProps) {
  if (publicState === undefined) {
    return null;
  }
  return (
    <Button variant="Primary" size="Small" onClick={onNextPhase}>
      {Strings.turn.nextPhase}
    </Button>
  );
}
