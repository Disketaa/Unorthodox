import type { PlayerId } from '@/Core';
import type { Player } from './GameState';

export function isParticipant(player: Player | undefined): boolean {
  return player !== undefined && player.isSpectator !== true;
}

export function participantIds(players: ReadonlyMap<PlayerId, Player>): PlayerId[] {
  const ids: PlayerId[] = [];
  players.forEach((player, id) => {
    if (isParticipant(player)) ids.push(id);
  });
  return ids;
}

export function eligiblePlayerIds(players: ReadonlyMap<PlayerId, Player>): PlayerId[] {
  return participantIds(players).filter((id) => players.get(id)?.isOnline === true);
}

export function participantAnswers(
  players: ReadonlyMap<PlayerId, Player>,
  answers: ReadonlyMap<PlayerId, string>
): Map<PlayerId, string> {
  return new Map([...answers].filter(([id]) => isParticipant(players.get(id))));
}
