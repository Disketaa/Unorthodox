import { Stack, Text } from '@/Design/Primitives';
import { Keyboard } from './Keyboard';

export function KeyboardGallery() {
  return (
    <Stack direction="Vertical" gap="Lg">
      <Text variant="Body">Keyboard</Text>
      <Keyboard
        backspaceLabel="Удалить символ"
        spaceLabel="Пробел"
        enterLabel="Ответить"
        onKeyPress={() => {}}
      />
      <Text variant="Caption">Disabled</Text>
      <Keyboard
        backspaceLabel="Удалить символ"
        spaceLabel="Пробел"
        enterLabel="Ответить"
        disabled
      />
    </Stack>
  );
}
