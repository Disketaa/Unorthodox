import { Card } from './Card';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';

export function CardGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Card Variants</Text>
      <Card variant="Elevated">
        <Text variant="Body">Elevated Card Content</Text>
      </Card>
      <Card variant="Outlined">
        <Text variant="Body">Outlined Card Content</Text>
      </Card>
      <Card variant="Plain">
        <Text variant="Body">Plain Card Content</Text>
      </Card>
    </Stack>
  );
}
