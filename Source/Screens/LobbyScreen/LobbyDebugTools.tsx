import { Button } from '@/Design/Components';
import { PublicState } from '@/Game';
import { Strings } from '@/Content';
import { hasRoomFor } from './LobbyRoom';

export interface LobbyDebugToolsProps {
  publicState: PublicState | undefined;
  onAddBot: () => void;
}

/**
 * What the lobby offers the host's dock: a player who was never asked for.
 *
 * Nothing outside the lobby, and nothing in a full room. A bot in the middle of a round would
 * be a seat holding up a round whose end nobody is waiting at, and a bot past the last seat is
 * a roster longer than the room allows.
 */
export function LobbyDebugTools({ publicState, onAddBot }: LobbyDebugToolsProps) {
  if (publicState?.phase !== 'Lobby' || !hasRoomFor(publicState.players)) {
    return null;
  }
  return (
    <Button variant="Primary" size="Small" onClick={onAddBot}>
      {Strings.lobby.addBot}
    </Button>
  );
}
