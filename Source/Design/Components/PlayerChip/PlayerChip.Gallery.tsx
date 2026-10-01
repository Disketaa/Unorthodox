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
      <Text variant="Body">With the host's marks, which only the host's roster offers</Text>
      <Stack direction="Horizontal" gap="Sm">
        <PlayerChip
          name="Ann"
          character="Ghost"
          color="Sky"
          isHost={true}
          onKick={() => {}}
          kickLabel="Исключить Ann"
        />
        <PlayerChip
          name="Bob"
          character="Hat"
          color="Rose"
          onKick={() => {}}
          kickLabel="Исключить Bob"
        />
      </Stack>
      <Text variant="Body">
        With a name too long for the row, which is cut with an ellipsis rather than
        wrapped or allowed to push the marks off the end
      </Text>
      <LongName />
    </Stack>
  );
}

/** One chip in a column, so it is as wide as the gallery and the cut is visible. */
function LongName() {
  return (
    <Stack direction="Vertical" gap="Sm">
      <PlayerChip
        name="Константинтинтинтинтин"
        character="Ghost"
        color="Sky"
        isHost={true}
        onKick={() => {}}
        kickLabel="Исключить Константинтинтинтинтин"
      />
    </Stack>
  );
}
