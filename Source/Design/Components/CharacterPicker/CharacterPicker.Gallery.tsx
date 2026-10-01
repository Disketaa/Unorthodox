import { CharacterPicker } from './CharacterPicker';
import { Stack, Text } from '@/Design/Primitives';

/**
 * Placeholder labels, since the design system cannot read the real ones.
 *
 * Written out rather than generated, so that adding a ninth character or a ninth
 * tint fails the build here and points at this file, instead of rendering an
 * unlabelled button in the gallery.
 */
const labels = {
  character: {
    Butterfly: 'Butterfly',
    Explosion: 'Explosion',
    Daisy: 'Daisy',
    Ghost: 'Ghost',
    Mask: 'Mask',
    Hat: 'Hat',
    Heart: 'Heart',
    Star: 'Star',
  },
  color: {
    Coral: 'Tint Coral',
    Amber: 'Tint Amber',
    Yellow: 'Tint Yellow',
    Lime: 'Tint Lime',
    Mint: 'Tint Mint',
    Sky: 'Tint Sky',
    Violet: 'Tint Violet',
    Rose: 'Tint Rose',
  },
  pickCharacter: (name: string) => `Pick ${name}`,
  customize: 'Customise',
};

export function CharacterPickerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">
        CharacterPicker. The character above, the cast and the palette below.
      </Text>
      <CharacterPicker
        character="Daisy"
        color="Sky"
        labels={labels}
        onPick={() => {}}
      />
    </Stack>
  );
}
