import { AnswerCard } from "./AnswerCard";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function AnswerCardGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">AnswerCard Examples</Text>
      <AnswerCard 
        text="This is a sample answer" 
        playerName="Player 1" 
      />
      <AnswerCard 
        text="This is another answer" 
        playerName="Player 2" 
        isRejected={true} 
      />
      <AnswerCard 
        text="Rejectable answer" 
        playerName="Player 3" 
        showReject={true} 
        onReject={() => {}} 
      />
    </Stack>
  );
}
