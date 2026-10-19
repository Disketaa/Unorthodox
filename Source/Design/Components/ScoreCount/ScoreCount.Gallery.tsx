import { Stack, Text } from '@/Design/Primitives';
import { ScoreCount } from './ScoreCount';

export function ScoreCountGallery() {
  return (
    <Stack direction="Vertical" gap="Lg" align="Center">
      <Text variant="Body">Score counting up</Text>
      <ScoreCount from={0} to={25} />
      <Text variant="Body">A step that added</Text>
      <ScoreCount from={5} to={19} added={14} />
      <Text variant="Body">One point</Text>
      <ScoreCount from={19} to={20} added={1} />
      <Text variant="Body">No change</Text>
      <ScoreCount from={10} to={10} />
    </Stack>
  );
}
