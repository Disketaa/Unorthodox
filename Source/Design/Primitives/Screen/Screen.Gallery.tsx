import { Screen } from './Screen';
import { Card, Wordmark } from '@/Design/Components';
import { Stack, Text } from '@/Design/Primitives';

/**
 * Two demonstrations rather than one per variant: each fills the viewport, because
 * filling the viewport is what lets `Top` and `Center` differ at all, so a gallery of
 * three of them is three screens of scrolling to look at one behaviour.
 *
 * Resize the window to see it: the second demo goes one, two, then three across, and
 * its fourth and fifth containers wrap to lines of their own.
 */
export function ScreenGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">At the top, side by side</Text>
      <Screen>
        <Card>
          <Text variant="Body">One</Text>
        </Card>
        <Card>
          <Text variant="Body">Two</Text>
        </Card>
      </Screen>

      <Text variant="Body">Centred, wrapping past three</Text>
      <Screen vertical="Center">
        <Card>
          <Text variant="Body">One</Text>
        </Card>
        <Card variant="Plain">
          <Wordmark label="Нестандартненько" />
        </Card>
        <Card>
          <Text variant="Body">Three</Text>
        </Card>
        <Card>
          <Text variant="Body">Four, on a line of its own</Text>
        </Card>
      </Screen>
    </Stack>
  );
}