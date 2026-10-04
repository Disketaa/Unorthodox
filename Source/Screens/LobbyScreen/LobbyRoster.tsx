import { Stack } from '@/Design/Primitives';
import { Separator } from '@/Design/Primitives';
import { PlayerChip } from '@/Design/Components';
import { PlayerId } from '@/Core';
import { Strings } from '@/Content';
import { PublicPlayer } from '@/Game';

export interface LobbyRosterProps {
  players: readonly PublicPlayer[];
  /** This device's player, outlined in the roster so it can be found in a full room. */
  ownPlayerId: PlayerId | null;
  isHost: boolean;
  /** Only the host gets this: the room's way to remove a player. */
  onKick: (playerId: PlayerId) => void;
}

/**
 * The roster: each player drawn as the character the host has them as, under a
 * rule that names it.
 *
 * The word is on the rule rather than in the card's title, because the card
 * above is titled by the room code: that is the room, and the list inside it is
 * one part of it. Naming the list here says the two are not the same thing
 * without taking the card's own title away from the thing the card is actually
 * for.
 *
 * Two nested stacks, and the gap on the outer one is the picker's rather than
 * the chips': a separator takes its spacing from whatever it sits in, so a
 * roster packed tight and a picker spread out gave two rules dividing the same
 * two things at different distances from each other. The chips keep their own
 * tight gap on the inner stack, where nothing is dividing anything.
 *
 * Kept apart from the screen so the screen stays about arranging parts.
 */
export function LobbyRoster({ players, ownPlayerId, isHost, onKick }: LobbyRosterProps) {
  return (
    <Stack gap="Md">
      <Separator>{Strings.lobby.roster}</Separator>
      <Stack gap="Sm">
        {players.map((player, index) => (
          <PlayerChip
            key={player.id}
            name={player.name}
            character={player.look.character}
            color={player.look.color}
            index={index}
            isHost={index === 0}
            isOnline={player.isOnline}
            isSelf={player.id === ownPlayerId}
            // The host cannot remove itself, so its own chip never offers the mark.
            onKick={isHost && player.id !== ownPlayerId ? () => onKick(player.id) : undefined}
            kickLabel={Strings.lobby.kick(player.name)}
          />
        ))}
      </Stack>
    </Stack>
  );
}
