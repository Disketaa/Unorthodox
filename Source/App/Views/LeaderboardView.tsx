import { LeaderboardScreen } from '@/Screens';
import { toLeaderboardRows } from '../Rankings';
import { PhaseViewProps } from './LobbyView';

/** Where the room stands after the round has been counted: the players in order, each with their
 * place leading the line, and what they won this round beside what they have altogether. A
 * player the room has lost keeps their line, held back rather than dropped. */
export function LeaderboardView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Leaderboard' ? view.publicState : undefined;
  const rows = toLeaderboardRows(
    [...view.playerNames.keys()],
    new Map((state?.scores ?? []).map((entry) => [entry.id, entry.score])),
    new Map((state?.round ?? []).map((entry) => [entry.id, entry.score])),
    view.playerNames,
    view.playerLooks,
    view.playerPresence,
    view.playerId
  );
  return (
    <LeaderboardScreen rows={rows} run={state?.reloadedAt ?? 0} paused={view.paused === true} />
  );
}
