import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PlayerId } from '@/Core';
import type { PhaseViewProps } from './LobbyView';

/** Every player's running total, read from whichever phase carries them. Only Scores and Final
 * send a score at all — a room in the lobby or mid-round has nothing settled to show — so every
 * other phase reads as zero rather than as missing. */
function readScores(view: PhaseViewProps['view']): ReadonlyMap<PlayerId, number> {
  const state = view.publicState;
  if (state?.phase === 'Scores') {
    return new Map(state.cumulative.map((row) => [row.id, row.score]));
  }
  if (state?.phase === 'Final') {
    return new Map(state.scores.map((row) => [row.id, row.score]));
  }
  return new Map();
}

/** The bar across the top of a game. In roster order, which is the order the room has held since
 * the lobby: a seat that moves about between phases is a seat nobody can find themselves in. */
export function PlayerBarView({ view }: PhaseViewProps) {
  const scores = readScores(view);
  const players: PlayerBarEntry[] = [...view.playerNames].map(([id, name]) => {
    const look = lookFor(view.playerLooks, id);
    return {
      id,
      name,
      score: scores.get(id) ?? 0,
      character: look.character,
      color: look.color,
      isOnline: view.playerPresence.get(id) ?? true,
      isTurning: id === view.turnPlayerId,
    };
  });

  return <PlayerBar players={players} ownPlayerId={view.playerId} />;
}
