import { CharacterColor, CharacterId } from '@/Core';
import { PlayerChip } from './PlayerChip';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';

/** The chips on a gallery row, as data so a row is one map rather than N near-identical blocks.
 * `onKick` is left off everywhere a chip is not host's, because the mark only exists there. */
interface RowChip {
  key: string;
  name: string;
  character: CharacterId;
  color: CharacterColor;
  isHost?: boolean;
  isSelf?: boolean;
  isOnline?: boolean;
  kickLabel?: string;
}

const VARIANTS: RowChip[] = [
  { key: 'alice', name: 'Alice', character: 'Butterfly', color: 'Coral', isOnline: true },
  { key: 'bob', name: 'Bob', character: 'Ghost', color: 'Sky', isOnline: false },
  {
    key: 'charlie',
    name: 'Charlie',
    character: 'Daisy',
    color: 'Mint',
    isHost: true,
    isOnline: true,
  },
  {
    key: 'diana',
    name: 'Diana',
    character: 'Star',
    color: 'Violet',
    isHost: true,
    isOnline: false,
  },
  { key: 'eve', name: 'Eve', character: 'Butterfly', color: 'Coral', isSelf: true },
  {
    key: 'eve-host',
    name: 'Eve',
    character: 'Butterfly',
    color: 'Coral',
    isSelf: true,
    isHost: true,
  },
];

/** Chips wearing the host's marks, which only the host's roster offers. */
const hostMarks: RowChip[] = [
  {
    key: 'ann',
    name: 'Ann',
    character: 'Ghost',
    color: 'Sky',
    isHost: true,
    kickLabel: 'Исключить Ann',
  },
  {
    key: 'bob-mark',
    name: 'Bob',
    character: 'Hat',
    color: 'Rose',
    kickLabel: 'Исключить Bob',
  },
];

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

/** One row of chips, each kicking into a no-op because the gallery shows looks, not actions. */
function ChipRow({ chips }: { chips: RowChip[] }) {
  return (
    <Stack direction="Horizontal" gap="Sm">
      {chips.map((chip) => (
        <PlayerChip
          key={chip.key}
          name={chip.name}
          character={chip.character}
          color={chip.color}
          isHost={chip.isHost}
          isSelf={chip.isSelf}
          isOnline={chip.isOnline}
          onKick={chip.kickLabel === undefined ? undefined : () => {}}
          kickLabel={chip.kickLabel}
        />
      ))}
    </Stack>
  );
}

export function PlayerChipGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">PlayerChip Variants</Text>
      <ChipRow chips={VARIANTS} />
      <Text variant="Body">With the host's marks, which only the host's roster offers</Text>
      <ChipRow chips={hostMarks} />
      <Text variant="Body">
        With a name too long for the row, which is cut with an ellipsis rather than wrapped or
        allowed to push the marks off the end
      </Text>
      <LongName />
    </Stack>
  );
}
