import { Button } from '@/Design/Components';
import { PublicState } from '@/Game';
import { Strings } from '@/Content';

export interface TurnDebugToolsProps {
  publicState: PublicState | undefined;
  onNextTurn: () => void;
}

/** What the dock offers the host in any phase: a hand to the next player. In every phase rather
 * than only the one the room is written for, since a turn is the room's own and the host moves
 * it whenever they mean to. Hidden in an empty room, where there is nobody to hand it to. */
export function TurnDebugTools({ publicState, onNextTurn }: TurnDebugToolsProps) {
  if (publicState === undefined || publicState.players.length === 0) {
    return null;
  }
  return (
    <Button variant="Primary" size="Small" onClick={onNextTurn}>
      {Strings.turn.next}
    </Button>
  );
}
