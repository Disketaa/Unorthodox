import { LeaderboardScreen } from '@/Screens';
import { toLeaderboardRows } from '../Rankings';
import { gameOverOf, winnerOf } from './GameOver';
import { PhaseViewProps } from './LobbyView';

/** Where the room stands after the round: players in order, each with place, round and total. A
 * player the room has lost keeps their line. Once the game is over the top line is the winner. */
export function LeaderboardView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Leaderboard' ? view.publicState : undefined;
  const over = gameOverOf(view);
  const winner = state === undefined ? undefined : winnerOf(state.scores);
  const rows = toLeaderboardRows(
    [...view.playerNames.keys()],
    new Map((state?.scores ?? []).map((entry) => [entry.id, entry.score])),
    new Map((state?.round ?? []).map((entry) => [entry.id, entry.score])),
    view.playerNames,
    view.playerLooks,
    view.playerPresence,
    view.playerId,
    over
  );
  return (
    <LeaderboardScreen
      rows={rows}
      run={state?.reloadedAt ?? 0}
      paused={view.paused === true}
      noWinner={over && winner === undefined}
      celebrate={over && winner !== undefined}
    />
  );
}
