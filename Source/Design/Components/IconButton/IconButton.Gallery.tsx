import { IconButton } from './IconButton';
import { Stack, Text } from '@/Design/Primitives';

export function IconButtonGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">IconButton Sizes</Text>
      <Stack direction="Horizontal" gap="Sm">
        <IconButton icon="Exit" label="Выйти" onClick={() => {}} />
        <IconButton icon="Kick" label="Исключить Ann" size="Small" onClick={() => {}} />
        <IconButton icon="Fullscreen" label="Во весь экран" onClick={() => {}} />
        <IconButton icon="Minimize" label="Выйти из полного экрана" onClick={() => {}} />
      </Stack>
    </Stack>
  );
}
