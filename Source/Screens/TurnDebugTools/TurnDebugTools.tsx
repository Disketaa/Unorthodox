import { IconButton } from '@/Design/Components';
import { PublicState } from '@/Game';
import { Strings } from '@/Content';

export interface TurnDebugToolsProps {
  publicState: PublicState | undefined;
  onNextTurn: () => void;
}

/** A hand to the next player, once a session is under way. Not in the lobby, where the session
 * starts the ordinary way, and not in an empty room, where there is nobody to hand it to. */
export function TurnDebugTools({ publicState, onNextTurn }: TurnDebugToolsProps) {
  if (
    publicState === undefined ||
    publicState.phase === 'Lobby' ||
    publicState.players.length === 0
  ) {
    return null;
  }
  return <IconButton icon="Turn" label={Strings.turn.next} onClick={onNextTurn} />;
}
