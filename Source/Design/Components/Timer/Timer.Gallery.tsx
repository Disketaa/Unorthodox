import { Timer } from './Timer';
import { Stack, Text } from '@/Design/Primitives';

export function TimerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Timer</Text>
      <Timer remainingMs={60_000} totalMs={60_000} />
      <Timer remainingMs={30_000} totalMs={60_000} />
      <Timer remainingMs={10_000} totalMs={60_000} />
      <Timer remainingMs={0} totalMs={60_000} />
    </Stack>
  );
}
