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
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  // The turn outlives the round that used it, so the mark belongs only to where the room is
  // actually waiting on it: an open bank. Once the bank is answered the phase is still Choosing,
  // now while the room reads the question, and by then nobody has been asked for anything.
  const waitingOnTurn = choosing !== undefined && choosing.theme === undefined;
  const players: PlayerBarEntry[] = [...view.playerNames].map(([id, name]) => {
    const look = lookFor(view.playerLooks, id);
    return {
      id,
      name,
      score: scores.get(id) ?? 0,
      character: look.character,
      color: look.color,
      isOnline: view.playerPresence.get(id) ?? true,
      isTurning: waitingOnTurn && id === view.turnPlayerId,
      // Every seat still at work, and not only this browser's own: the room says who has written,
      // so a row of seats fills up as the answers come in. Writing over an answer already sent
      // counts as work again, since from the room's side the player is back on the answer.
      isWorking:
        view.phase === 'Writing' &&
        (!view.submittedIds.has(id) || (id === view.playerId && view.editing)),
    };
  });

  return <PlayerBar players={players} ownPlayerId={view.playerId} />;
}
