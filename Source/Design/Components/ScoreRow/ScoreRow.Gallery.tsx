import { ScoreRow } from "./ScoreRow";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function ScoreRowGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">ScoreRow Examples</Text>
      <ScoreRow playerName="Alice" character="Character1" color="Coral" score={15} rank={1} />
      <ScoreRow playerName="Bob" character="Character5" color="Sky" score={12} rank={2} />
      <ScoreRow playerName="Charlie" character="Character3" color="Mint" score={12} rank={3} />
      <ScoreRow playerName="Diana" character="Character9" color="Violet" score={8} rank={4} />
    </Stack>
  );
}
