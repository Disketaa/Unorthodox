import { ScoreRow } from './ScoreRow';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';

export function ScoreRowGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">ScoreRow Examples</Text>
      <ScoreRow playerName="Alice" character="Butterfly" color="Coral" score={15} rank={1} />
      <ScoreRow playerName="Bob" character="Ghost" color="Sky" score={12} rank={2} />
      <ScoreRow playerName="Charlie" character="Daisy" color="Mint" score={12} rank={3} />
      <ScoreRow playerName="Diana" character="Star" color="Violet" score={8} rank={4} />
    </Stack>
  );
}
