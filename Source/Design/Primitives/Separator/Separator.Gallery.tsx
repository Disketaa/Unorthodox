import { Separator } from './Separator';
import { Card } from '@/Design/Components';
import { Stack, Text } from '@/Design/Primitives';

export function SeparatorGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Separator, in a card, bare and with a word in it.</Text>
      <Card variant="Elevated">
        <Stack gap="Md">
          <Text variant="Body">Above the rule</Text>
          <Separator />
          <Text variant="Body">Below a bare rule</Text>
          <Separator>Лобби (3/12)</Separator>
          <Text variant="Body">Below a named rule</Text>
        </Stack>
      </Card>
    </Stack>
  );
}
