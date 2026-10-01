import { IconButton } from './IconButton';
import { Stack, Text } from '@/Design/Primitives';

export function IconButtonGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">IconButton Tones</Text>
      <Stack direction="Horizontal" gap="Sm">
        <IconButton icon="Exit" label="Выйти" onClick={() => {}} />
        <IconButton icon="Kick" label="Исключить" onClick={() => {}} />
        <IconButton icon="Kick" label="Исключить" tone="Muted" onClick={() => {}} />
      </Stack>
    </Stack>
  );
}
