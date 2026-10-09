import { Stack, Text } from '@/Design/Primitives';
import { Keyboard } from './Keyboard';

const labels = {
  backspaceLabel: 'Удалить символ',
  spaceLabel: 'Пробел',
  enterLabel: 'Ответить',
  langLabel: 'Сменить язык',
};

export function KeyboardGallery() {
  return (
    <Stack direction="Vertical" gap="Lg">
      <Text variant="Body">Keyboard</Text>
      <Keyboard {...labels} onKeyPress={() => {}} />
      <Text variant="Caption">Disabled</Text>
      <Keyboard {...labels} disabled />
    </Stack>
  );
}
