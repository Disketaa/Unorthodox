import { PlayerBar } from './PlayerBar';
import { Stack, Text } from '@/Design/Primitives';
import type { PlayerBarEntry } from './PlayerBar';

/** A room of eight, the most a room that is still worth drawing looks like. The long name is
 * here on purpose: a seat has to hold a name of any length without pushing the row along. */
const room: PlayerBarEntry[] = [
  { id: 'p1', name: 'Anya', character: 'Butterfly', color: 'Coral' },
  { id: 'p2', name: 'Berenice', character: 'Ghost', color: 'Sky' },
  { id: 'p3', name: 'Kai', character: 'Daisy', color: 'Mint' },
  { id: 'p4', name: 'Maximiliana', character: 'Star', color: 'Violet' },
  { id: 'p5', name: 'Rue', character: 'Hat', color: 'Rose' },
  { id: 'p6', name: 'Tobias', character: 'Heart', color: 'Amber' },
  { id: 'p7', name: 'Wren', character: 'Mask', color: 'Yellow' },
  { id: 'p8', name: 'Xiomara', character: 'Explosion', color: 'Lime' },
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
