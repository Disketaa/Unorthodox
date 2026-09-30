import { RoomCodeBadge } from "./RoomCodeBadge";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function RoomCodeBadgeGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">RoomCodeBadge</Text>
      <RoomCodeBadge code="ABCD" />
      <RoomCodeBadge code="TEAM" />
      <RoomCodeBadge code="GAME" />
    </Stack>
  );
}