import { Button } from "./Button";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function ButtonGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Button Variants</Text>
      <Stack direction="Horizontal" gap="Sm">
        <Button variant="Primary" onClick={() => {}}>Primary</Button>
        <Button variant="Secondary" onClick={() => {}}>Secondary</Button>
        <Button variant="Ghost" onClick={() => {}}>Ghost</Button>
        <Button variant="Muted" onClick={() => {}}>Muted</Button>
      </Stack>
      <Text variant="Body">Button Sizes</Text>
      <Stack direction="Horizontal" gap="Sm">
        <Button variant="Primary" size="Small" onClick={() => {}}>Small</Button>
        <Button variant="Primary" size="Medium" onClick={() => {}}>Medium</Button>
        <Button variant="Primary" size="Large" onClick={() => {}}>Large</Button>
      </Stack>
      <Text variant="Body">Button States</Text>
      <Stack direction="Horizontal" gap="Sm">
        <Button variant="Primary" disabled onClick={() => {}}>Disabled</Button>
        <Button variant="Primary" loading onClick={() => {}}>Loading</Button>
      </Stack>
    </Stack>
  );
}