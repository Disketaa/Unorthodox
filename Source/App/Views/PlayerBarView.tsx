import { PlayerId } from '@/Core';
import { PublicState } from '@/Game';
import { PlayerBar, type PlayerBarEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PhaseViewProps } from './LobbyView';

/**
 * The scores this player is told about, in the phases that carry any.
 *
 * The running total where the room sends one, so the bar does not drop back to the round
 * it just scored at the moment the scores phase arrives and climb again on the next
 * round. Before the first round nothing is sent, and every slot shows nothing rather
 * than a zero that reads as a score somebody earned.
 */
function scoresIn(state: PublicState | undefined): ReadonlyMap<PlayerId, number> {
  const scores = new Map<PlayerId, number>();
  const totals =
    state !== undefined && 'cumulative' in state
      ? state.cumulative
      : state !== undefined && 'scores' in state
        ? state.scores
        : [];
  totals.forEach((entry) => scores.set(entry.id, entry.score));
  return scores;
}

/**
 * The bar across the top of a game.
 *
 * In roster order, which is the order the room has held since the lobby: a face that
 * moves about as the scores land is a face nobody can find themselves in.
 */
export function PlayerBarView({ view }: PhaseViewProps) {
  const scores = scoresIn(view.publicState);
  const players: PlayerBarEntry[] = [...view.playerNames].map(([id, name]) => {
    const look = lookFor(view.playerLooks, id);
    return {
      id,
      name,
      character: look.character,
      color: look.color,
      score: scores.get(id) ?? 0,
      isOnline: view.playerPresence.get(id) ?? true,
    };
  });

  return <PlayerBar players={players} ownPlayerId={view.playerId} />;
}