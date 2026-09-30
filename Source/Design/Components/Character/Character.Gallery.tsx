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

      <Text variant="Body">Still, reacting, and placed in a row</Text>
      <Stack direction="Horizontal" gap="Sm" align="End">
        <Character character="Character1" color="Mint" moving={false} />
        <Character character="Character1" color="Mint" pulse={1} />
        <Character character="Character2" color="Mint" pulse={1} moving={false} />
      </Stack>

      <Text variant="Body">
        Every character pops the same way: on mount, on a tint change, and on a
        change of character. A reacting character pops each time `pulse` changes,
        and a row ripples in turn rather than all at once.
      </Text>
    </Stack>
  );
}
