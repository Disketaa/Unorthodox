import { Character } from "./Character";
import { CharacterColors, CharacterIds } from "@/Core";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function CharacterGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Every character in the first tint</Text>
      <Stack direction="Horizontal" gap="Sm">
        {CharacterIds.map((character) => (
          <Character key={character} character={character} color="Coral" />
        ))}
      </Stack>

      <Text variant="Body">One character in every tint</Text>
      <Stack direction="Horizontal" gap="Sm">
        {CharacterColors.map((color) => (
          <Character key={color} character="Character3" color={color} />
        ))}
      </Stack>

      <Text variant="Body">Sizes</Text>
      <Stack direction="Horizontal" gap="Sm" align="End">
        <Character character="Character1" color="Mint" size="Small" />
        <Character character="Character1" color="Mint" size="Medium" />
        <Character character="Character1" color="Mint" size="Large" />
      </Stack>

      <Text variant="Body">Still, and the selected one</Text>
      <Stack direction="Horizontal" gap="Sm" align="End">
        <Character character="Character1" color="Mint" moving={false} />
        <Character character="Character1" color="Mint" selected />
        <Character character="Character1" color="Mint" moving={false} selected />
      </Stack>

      <Text variant="Body">
        Every character pops in on mount and again on a tint change, and the
        chosen one pops when it is picked, so this row re-pops on reload.
      </Text>
    </Stack>
  );
}
