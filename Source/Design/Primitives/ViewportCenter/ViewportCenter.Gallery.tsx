import { ViewportCenter } from './ViewportCenter';
import { Stack, Text } from '@/Design/Primitives';

/** The centring, with something above it. The whole of the primitive is invisible without a
 * sibling above, so the gallery has to have one: a `ViewportCenter` on its own is an ordinary
 * centred box and shows nothing at all. Resize the window and the block stays in the middle of
 * the screen while the thing above it changes height — which is the property, and the reason it
 * measures rather than counting siblings. */
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
