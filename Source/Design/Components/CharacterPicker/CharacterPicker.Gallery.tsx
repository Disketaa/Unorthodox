import { CharacterPicker, CharacterPickerLabels } from './CharacterPicker';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';

/**
 * Placeholder labels, since the design system cannot read the real ones.
 *
 * Written out rather than generated, so that adding a tenth character or a ninth
 * tint fails the build here and points at this file, instead of rendering an
 * unlabelled button in the gallery.
 */
const labels: CharacterPickerLabels = {
  character: {
    Character1: 'Character 1',
    Character2: 'Character 2',
    Character3: 'Character 3',
    Character4: 'Character 4',
    Character5: 'Character 5',
    Character6: 'Character 6',
    Character7: 'Character 7',
    Character8: 'Character 8',
    Character9: 'Character 9',
  },
  color: {
    Coral: 'Tint Coral',
    Amber: 'Tint Amber',
    Lime: 'Tint Lime',
    Mint: 'Tint Mint',
    Sky: 'Tint Sky',
    Violet: 'Tint Violet',
    Rose: 'Tint Rose',
    Sand: 'Tint Sand',
  },
};

export function CharacterPickerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">CharacterPicker</Text>
      <CharacterPicker
        character="Character3"
        color="Sky"
        labels={labels}
        onPick={() => {}}
      />
    </Stack>
  );
}
