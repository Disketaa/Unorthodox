import { Stack, Text } from '@/Design/Primitives';

export function TextGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Display">Нестандартненько</Text>
      <Text variant="Title">Title variant</Text>
      <Text variant="Body">Body variant, the default for running text.</Text>
      <Text variant="Caption">Caption variant, for hints and counters.</Text>
      <Text variant="Mono">Mono variant</Text>
      <Text variant="Body" fontWeight="Bold">
        Body, bold
      </Text>
    </Stack>
  );
}
