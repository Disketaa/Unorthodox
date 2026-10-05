import { Stack, Text } from '@/Design/Primitives';
import { CharacterColor, CharacterId } from '@/Core';
import { PlayerCard, type PlayerCardEntry } from './PlayerCard';

const cast: Record<'a' | 'b', { character: CharacterId; color: CharacterColor }> = {
  a: { character: 'Butterfly', color: 'Coral' },
  b: { character: 'Ghost', color: 'Sky' },
};

/** One player as the card draws them, with the fields a gallery case varies. */
function player(overrides: Partial<PlayerCardEntry> = {}): PlayerCardEntry {
  return { name: 'Аня', character: 'Butterfly', color: 'Coral', score: 7, ...overrides };
}

export function PlayerCardGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">This browser's own seat: face, name and standing</Text>
      <PlayerCard player={player()} />

      <Text variant="Body">The host's own seat, wearing the crown</Text>
      <PlayerCard player={player(cast.a)} isHost />

      <Text variant="Body">A single figure, which is most of a first round</Text>
      <PlayerCard player={player({ character: cast.b.character, color: cast.b.color, score: 0 })} />

      <Text variant="Body">A long name, cut rather than wrapped</Text>
      <PlayerCard player={player({ name: 'Константинтинтинтин', score: 128 })} />

      <Text variant="Body">This player dropped and is held back rather than removed</Text>
      <PlayerCard player={player({ isOnline: false })} />
    </Stack>
  );
}
