import { PlayerChip } from "./PlayerChip";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function PlayerChipGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">PlayerChip Variants</Text>
      <Stack direction="Horizontal" gap="Sm">
        <PlayerChip name="Alice" character="Character1" color="Coral" isOnline={true} />
        <PlayerChip name="Bob" character="Character5" color="Sky" isOnline={false} />
        <PlayerChip name="Charlie" character="Character3" color="Mint" isHost={true} isOnline={true} />
        <PlayerChip name="Diana" character="Character9" color="Violet" isHost={true} isOnline={false} />
      </Stack>
    </Stack>
  );
}
