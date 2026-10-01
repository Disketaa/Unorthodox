import { PlayerChip } from "./PlayerChip";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function PlayerChipGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">PlayerChip Variants</Text>
      <Stack direction="Horizontal" gap="Sm">
        <PlayerChip name="Alice" character="Butterfly" color="Coral" isOnline={true} />
        <PlayerChip name="Bob" character="Ghost" color="Sky" isOnline={false} />
        <PlayerChip name="Charlie" character="Daisy" color="Mint" isHost={true} isOnline={true} />
        <PlayerChip name="Diana" character="Star" color="Violet" isHost={true} isOnline={false} />
        <PlayerChip name="Eve" character="Butterfly" color="Coral" isSelf={true} />
        <PlayerChip name="Eve" character="Butterfly" color="Coral" isSelf={true} isHost={true} />
      </Stack>
    </Stack>
  );
}
