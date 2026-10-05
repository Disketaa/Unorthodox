import { PlayerId, PlayerLook, CharacterColor, CharacterId } from '@/Core';

/** Presentation shapes shared by more than one screen. */
export interface ScoreEntry {
  playerName: string;
  character: CharacterId;
  color: CharacterColor;
  score: number;
  rank: number;
}

/** The look to show for a player, when the roster is all that is known. A player is always in
 * the roster before they have a score, so a fallback only shows if the roster was somehow
 * missed. It is the first character rather than nothing, so a row never collapses to a bare
 * name. */
export const FallbackLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };

export function lookFor(looks: ReadonlyMap<PlayerId, PlayerLook>, id: PlayerId): PlayerLook {
  return looks.get(id) ?? FallbackLook;
}
