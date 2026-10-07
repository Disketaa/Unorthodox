import { Stack } from '@/Design/Primitives';
import { ThemeCard } from './ThemeCard';

export function ThemeCardGallery() {
  return (
    <Stack direction="Horizontal" gap="Md" align="Stretch">
      <ThemeCard theme="VideoGames" name="Видеоигры" />
      {/* Held back but still under the pointer: another player's turn. */}
      <ThemeCard theme="Nature" name="Природа" waiting />
      {/* Pressed out of every hover, which is the room having answered. */}
      <ThemeCard theme="Music" name="Музыка" locked />
    </Stack>
  );
}
