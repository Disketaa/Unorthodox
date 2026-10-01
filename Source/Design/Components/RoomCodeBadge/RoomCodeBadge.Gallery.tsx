import { RoomCodeBadge } from './RoomCodeBadge';
import { Stack, Text } from '@/Design/Primitives';

export function RoomCodeBadgeGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">RoomCodeBadge</Text>
      {/* Inside a title, because it is only ever rendered as one. */}
      <Text variant="Title">
        <RoomCodeBadge code="7752" />
      </Text>
    </Stack>
  );
}
