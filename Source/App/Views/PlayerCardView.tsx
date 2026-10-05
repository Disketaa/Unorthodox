import { PlayerId } from '@/Core';
import { PublicState } from '@/Game';
import { PlayerCard, type PlayerCardEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PhaseViewProps } from './LobbyView';

/** The scores this player is told about, in the phases that carry any. The running total where
 * the room sends one, so the card does not drop back to the round it just scored. Nothing
 * before the first round, rather than a zero that reads as a score somebody earned. */
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

/** This browser's own card at the top of a game. One player, not the room: through a round it is
 * one figure being looked for, and sixteen faces are sixteen things to search. The rest of the
 * room is in the lobby roster and the scoreboard. */
export function PlayerCardView({ view }: PhaseViewProps) {
  // A browser with no seat in the room has nothing to draw a card of: the id is the room's
  // answer to who this browser is, and there is no card until there is an answer.
  if (view.playerId === null) return null;
  const scores = scoresIn(view.publicState);
  const name = view.playerNames.get(view.playerId) ?? '';
  const look = lookFor(view.playerLooks, view.playerId);
  const entry: PlayerCardEntry = {
    name,
    character: look.character,
    color: look.color,
    score: scores.get(view.playerId) ?? 0,
    isOnline: view.playerPresence.get(view.playerId) ?? true,
  };

  return <PlayerCard player={entry} isHost={view.isHost} />;
}