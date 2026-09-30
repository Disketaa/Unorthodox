import { Stack, Text } from '@/Design/Primitives';
import { Banner } from '@/Design/Components';
import { Strings } from '@/Content';

/** Shown to clients when the host disconnects. Reconnecting is out of v1 scope. */
export function HostLeftScreen() {
  return (
    <Stack gap="Lg" padding="Lg" align="Stretch">
      <Text variant="Title">{Strings.status.hostLeft}</Text>
      <Banner variant="Error">{Strings.status.hostLeftHint}</Banner>
    </Stack>
  );
}
