import { PlayerBar } from './PlayerBar';
import { Stack, Text } from '@/Design/Primitives';
import type { PlayerBarEntry } from './PlayerBar';

/** A room of eight, the most a room that is still worth drawing looks like. */
const room: PlayerBarEntry[] = [
  { id: 'p1', character: 'Butterfly', color: 'Coral' },
  { id: 'p2', character: 'Ghost', color: 'Sky' },
  { id: 'p3', character: 'Daisy', color: 'Mint' },
  { id: 'p4', character: 'Star', color: 'Violet' },
  { id: 'p5', character: 'Hat', color: 'Rose' },
  { id: 'p6', character: 'Heart', color: 'Amber' },
  { id: 'p7', character: 'Mask', color: 'Yellow' },
  { id: 'p8', character: 'Explosion', color: 'Lime' },
];

export function PlayerBarGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">PlayerBar: a room of two</Text>
      <PlayerBar players={room.slice(0, 2)} />
      <Text variant="Body">A room of eight, with this browser in it</Text>
      <PlayerBar players={room} ownPlayerId="p3" />
      <Text variant="Body">The local player who has dropped, held back rather than removed</Text>
      <PlayerBar
        players={room.map((player) =>
          player.id === 'p3' ? { ...player, isOnline: false } : player,
        )}
        ownPlayerId="p3"
      />
    </Stack>
  );
}
