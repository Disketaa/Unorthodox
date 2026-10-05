import { ViewportCenter } from './ViewportCenter';
import { Stack, Text } from '@/Design/Primitives';

/** The centring, with something above it. The primitive is invisible without a sibling above, so
 * the gallery has to have one: on its own this is an ordinary centred box. Resize the window
 * and the block stays in the middle. */
export function ViewportCenterGallery() {
  return (
    <Stack direction="Vertical" gap="Md" grow>
      <Text variant="Body">Everything at the top of the game</Text>
      <Text variant="Caption">
        A roster, a timer, whatever else a phase puts above this — the block below stays in
        the middle of the screen rather than in the middle of what is left.
      </Text>
      <ViewportCenter>
        <Text variant="Title">Centred in the viewport</Text>
      </ViewportCenter>
    </Stack>
  );
}
