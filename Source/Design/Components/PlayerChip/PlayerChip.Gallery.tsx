import { PlayerChip } from "./PlayerChip";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function PlayerChipGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">PlayerChip Variants</Text>
      <Stack direction="Horizontal" gap="Sm">
        <PlayerChip name="Alice" isOnline={true} />
        <PlayerChip name="Bob" isOnline={false} />
        <PlayerChip name="Charlie" isHost={true} isOnline={true} />
        <PlayerChip name="Diana" isHost={true} isOnline={false} />
      </Stack>
    </Stack>
  );
}