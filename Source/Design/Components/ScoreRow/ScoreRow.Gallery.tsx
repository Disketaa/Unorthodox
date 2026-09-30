import { ScoreRow } from "./ScoreRow";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function ScoreRowGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">ScoreRow Examples</Text>
      <ScoreRow playerName="Alice" score={15} rank={1} />
      <ScoreRow playerName="Bob" score={12} rank={2} />
      <ScoreRow playerName="Charlie" score={12} rank={3} />
      <ScoreRow playerName="Diana" score={8} rank={4} />
    </Stack>
  );
}