import { ExitButton } from './ExitButton';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';

export function ExitButtonGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">ExitButton</Text>
      <Stack direction="Horizontal" gap="Sm">
        <ExitButton label="Выйти" onClick={() => {}} />
      </Stack>
    </Stack>
  );
}
