import { Button } from './Button';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';

/** The buttons on a gallery row, as data so a row is one map rather than N near-identical
 * blocks. */
interface RowButton {
  label: string;
  variant: 'Primary' | 'Secondary' | 'Ghost' | 'Muted';
  size?: 'Small' | 'Medium' | 'Large';
  disabled?: boolean;
  loading?: boolean;
  pulse?: boolean;
}

const VARIANTS: RowButton[] = [
  { label: 'Primary', variant: 'Primary' },
  { label: 'Secondary', variant: 'Secondary' },
  { label: 'Ghost', variant: 'Ghost' },
  { label: 'Muted', variant: 'Muted' },
];

const SIZES: RowButton[] = [
  { label: 'Small', variant: 'Primary', size: 'Small' },
  { label: 'Medium', variant: 'Primary', size: 'Medium' },
  { label: 'Large', variant: 'Primary', size: 'Large' },
];

const STATES: RowButton[] = [
  { label: 'Disabled', variant: 'Primary', disabled: true },
  { label: 'Loading', variant: 'Primary', loading: true },
  { label: 'Pulse', variant: 'Primary', pulse: true },
];

/** One row of buttons, each wired to a no-op because the gallery shows looks rather than
 * actions. */
function ButtonRow({ buttons }: { buttons: RowButton[] }) {
  return (
    <Stack direction="Horizontal" gap="Sm">
      {buttons.map((button) => (
        <Button
          key={button.label}
          variant={button.variant}
          size={button.size}
          disabled={button.disabled}
          loading={button.loading}
          pulse={button.pulse}
          onClick={() => {}}
        >
          {button.label}
        </Button>
      ))}
    </Stack>
  );
}

export function ButtonGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Button Variants</Text>
      <ButtonRow buttons={VARIANTS} />
      <Text variant="Body">Button Sizes</Text>
      <ButtonRow buttons={SIZES} />
      <Text variant="Body">Button States</Text>
      <ButtonRow buttons={STATES} />
    </Stack>
  );
}
