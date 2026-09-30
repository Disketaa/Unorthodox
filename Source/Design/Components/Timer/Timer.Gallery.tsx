import { Timer } from "./Timer";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function TimerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Timer Examples</Text>
      <Timer remainingMs={30000} totalMs={60000} />
      <Timer remainingMs={10000} totalMs={60000} />
      <Timer remainingMs={5000} totalMs={60000} />
      <Timer remainingMs={1000} totalMs={60000} />
    </Stack>
  );
}