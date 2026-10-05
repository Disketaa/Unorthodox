import { Screen, ScreenAlign, ScreenVertical } from './Screen';
import { Card, Wordmark } from '@/Design/Components';
import { Stack, Text } from '@/Design/Primitives';

interface DemoProps {
  caption: string;
  vertical: ScreenVertical;
  align: ScreenAlign;
  /** Whether the first container is the wordmark. It is a third of the height of the others,
   * which is the whole reason `align` exists: it is the one arrangement on the page where the
   * difference between the two alignments is impossible to miss. */
  wordmark?: boolean;
  /** Extra containers, which is what shows the cap doing its work. */
  spare?: boolean;
}

/** One arrangement, labelled. Split out so each stays readable and under the limit. */
function Demo({ caption, vertical, align, wordmark, spare }: DemoProps) {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">{caption}</Text>
      <Screen vertical={vertical} align={align}>
        {wordmark ? (
          <Card variant="Plain">
            <Wordmark label="Нестандартненько" />
          </Card>
        ) : (
          <Card>
            <Text variant="Body">One</Text>
          </Card>
        )}
        <Card>
          <Text variant="Body">Two</Text>
        </Card>
        {spare && (
          <>
            <Card>
              <Text variant="Body">Three</Text>
            </Card>
            <Card>
              <Text variant="Body">Four, on a line of its own</Text>
            </Card>
          </>
        )}
      </Screen>
    </Stack>
  );
}

/** Three arrangements rather than one per combination: each fills the viewport, which is what
 * lets `Top` and `Center` differ at all. `align` only shows once two containers are side by
 * side: the second lines them up by the top edge, the third centres them against one another. */
export function ScreenGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Demo caption="At the top, lined up by the top edge" vertical="Top" align="Start" />
      <Demo caption="Centred, wrapping past three" vertical="Center" align="Start" spare />
      <Demo
        caption="Centred, and centred against each other"
        vertical="Center"
        align="Center"
        wordmark
      />
    </Stack>
  );
}