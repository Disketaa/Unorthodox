import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PhaseViewProps } from './LobbyView';

/** The bar across the top of a game. In roster order, which is the order the room has held since
 * the lobby: a face that moves about between phases is a face nobody can find themselves in. */
export function PlayerBarView({ view }: PhaseViewProps) {
  const players: PlayerBarEntry[] = [...view.playerNames].map(([id, name]) => {
    const look = lookFor(view.playerLooks, id);
    return {
      id,
      name,
      character: look.character,
      color: look.color,
      isOnline: view.playerPresence.get(id) ?? true,
    };
  });

  return <PlayerBar players={players} ownPlayerId={view.playerId} />;
}
