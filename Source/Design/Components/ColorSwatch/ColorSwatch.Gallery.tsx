import { ColorSwatch } from "./ColorSwatch";
import { CharacterColors } from "@/Core";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function ColorSwatchGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Every tint</Text>
      <Stack direction="Horizontal" gap="Sm">
        {CharacterColors.map((color) => (
          <ColorSwatch key={color} color={color} />
        ))}
      </Stack>

      <Text variant="Body">Sizes</Text>
      <Stack direction="Horizontal" gap="Sm" align="End">
        <ColorSwatch color="Mint" size="Small" />
        <ColorSwatch color="Mint" size="Medium" />
        <ColorSwatch color="Mint" size="Large" />
      </Stack>
    </Stack>
  );
}
