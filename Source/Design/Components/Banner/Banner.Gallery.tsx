import { Banner } from './Banner';
import { Stack, Text } from '@/Design/Primitives';

export function BannerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Banner Variants</Text>
      <Banner variant="Info">This is an info banner</Banner>
      <Banner variant="Success">Success! Operation completed</Banner>
      <Banner variant="Warning">Warning: Please check your input</Banner>
      <Banner variant="Error">Error: Something went wrong</Banner>
      <Text variant="Body">Banner Alignment</Text>
      <Stack direction="Horizontal" gap="Sm">
        <Banner variant="Info">Left by default</Banner>
        <Banner variant="Info" align="Center">
          Centred
        </Banner>
      </Stack>
      <Marks />
      <Values />
      <Text variant="Body">Banner Accent</Text>
      <Banner variant="Accent">Отладка включена</Banner>
    </Stack>
  );
}

/** The three marks a banner can lead with, one row each: the mark says something about the line
 * beside it, so the rows are read rather than compared. */
function Marks() {
  return (
    <>
      <Text variant="Body">Banner Marks</Text>
      <Banner variant="Info">The default mark</Banner>
      <Banner variant="Info" mark="Loading">
        The spinning mark
      </Banner>
      <Banner variant="Info" mark="Clock">
        The mark for a length of time
      </Banner>
    </>
  );
}

/** A value held against the right edge, and the same two filled so their figures line up down
 * the column they are read as a column from. */
function Values() {
  return (
    <>
      <Text variant="Body">Banner Values</Text>
      <Banner variant="Muted" mark="Clock" value="60 с">
        Время на ответ
      </Banner>
      <Banner variant="Muted" mark="Clock" value="90 с">
        Время на голосование
      </Banner>
      <Text variant="Body">Banner Fill</Text>
      <Stack gap="Sm" align="Stretch">
        <Banner variant="Muted" mark="Clock" fill value="60 с">
          Время на ответ
        </Banner>
        <Banner variant="Muted" mark="Clock" fill value="90 с">
          Время на голосование
        </Banner>
      </Stack>
    </>
  );
}
