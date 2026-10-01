import { Wordmark } from './Wordmark';
import { Stack, Text } from '@/Design/Primitives';

export function WordmarkGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">The game's name, as the drawing</Text>
      <Wordmark label="Нестандартненько" />
    </Stack>
  );
}