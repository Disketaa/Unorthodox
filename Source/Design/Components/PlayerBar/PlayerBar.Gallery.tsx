import { Stack, Text } from '@/Design/Primitives';
import { CharacterColor, CharacterId } from '@/Core';
import { PlayerBar, type PlayerBarEntry } from './PlayerBar';

const cast: { character: CharacterId; color: CharacterColor }[] = [
  { character: 'Butterfly', color: 'Coral' },
  { character: 'Ghost', color: 'Sky' },
  { character: 'Daisy', color: 'Mint' },
  { character: 'Star', color: 'Violet' },
  { character: 'Hat', color: 'Rose' },
  { character: 'Heart', color: 'Amber' },
  { character: 'Mask', color: 'Lime' },
  { character: 'Explosion', color: 'Yellow' },
];

/** A room of `count` players, named in the order the roster holds them. */
function room(count: number): PlayerBarEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    name: `Игрок ${index + 1}`,
    character: cast[index % cast.length]?.character ?? 'Butterfly',
    color: cast[index % cast.length]?.color ?? 'Coral',
    score: (index * 3) % 13,
  }));
}

export function PlayerBarGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">A room, in roster order, with the host crowned and the local player ringed</Text>
      <PlayerBar players={room(5)} ownPlayerId="p2" />

      <Text variant="Body">As many players as the bar holds, wrapped onto a second row</Text>
      <PlayerBar players={room(16)} ownPlayerId="p9" />

      <Text variant="Body">
        A room past the slot count, where the local player is last so they are still on
        the bar
      </Text>
      <PlayerBar players={room(18)} ownPlayerId="p16" />

      <Text variant="Body">
        A name longer than its slot, cut with an ellipsis rather than wrapped
      </Text>
      <PlayerBar
        players={[
          { id: 'long', name: 'Константинтинтинтин', character: 'Ghost', color: 'Sky', score: 12 },
          { id: 'short', name: 'Аня', character: 'Star', color: 'Violet', score: 4 },
        ]}
        ownPlayerId="long"
      />
    </Stack>
  );
}