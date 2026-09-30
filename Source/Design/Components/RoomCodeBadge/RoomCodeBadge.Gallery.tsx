import { RoomCodeBadge } from "./RoomCodeBadge";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function RoomCodeBadgeGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">RoomCodeBadge</Text>
      <Stack direction="Vertical" gap="Xs">
        <Text variant="Title">Лобби</Text>
        <RoomCodeBadge code="ABCD" />
      </Stack>
    </Stack>
  );
}
