import { VoteButton } from "./VoteButton";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";
import { useState } from "preact/hooks";

export function VoteButtonGallery() {
  const [voted, setVoted] = useState(false);
  
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">VoteButton</Text>
      <VoteButton voted={voted} onVote={() => setVoted(!voted)} />
      <Text variant="Body">Current state: {voted ? "Voted" : "Not voted"}</Text>
    </Stack>
  );
}
