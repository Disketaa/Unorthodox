import { PlayerId } from '@/Core';
import { PublicState } from '@/Game';
import { PlayerCard, type PlayerCardEntry } from '@/Design/Components';
import { lookFor } from '@/Screens';
import type { PhaseViewProps } from './LobbyView';

/**
 * The scores this player is told about, in the phases that carry any.
 *
 * The running total where the room sends one, so the card does not drop back to the round it
 * just scored at the moment the scores phase arrives and climb again on the next round. Before
 * the first round nothing is sent, and the card shows nothing rather than a zero that reads as a
 * score somebody earned.
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
 * This browser's own card at the top of a game.
 *
 * One player out of the room, and this one's own: their face, their name and where they stand.
 * The rest of the room is in the lobby's roster and in the scoreboard at the end of a round,
 * which are the two moments a player wants everybody in; through a round it is one figure they
 * are looking for, and a card holding sixteen faces is sixteen things to search.
 *
 * The score comes from the running total where the room sends one, and the crown is drawn from
 * whether this browser is hosting rather than from the roster's order: there is no order here
 * for the host to be first of.
 */
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