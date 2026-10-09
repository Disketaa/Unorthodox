import { Stack, Text } from '@/Design/Primitives';
import { Accents } from '@/Core';
import { ThemeLabel } from './ThemeLabel';

const accents = [Accents.Lime, Accents.Sky, Accents.Amber];

export function ThemeLabelGallery() {
  return (
    <Stack direction="Vertical" gap="Lg">
      <Text variant="Body">ThemeLabel</Text>
      <Stack direction="Horizontal" gap="Sm" align="Center">
        {accents.map((accent) => (
          <ThemeLabel key={accent.ink} theme="Природа" accent={accent} />
        ))}
      </Stack>
    </Stack>
  );
}
