import { Stack, Text } from '@/Design/Primitives';
import { Banner, Button } from '@/Design/Components';
import { Strings } from '@/Content';

export interface NameTakenScreenProps {
  onBack: () => void;
}

/**
 * Shown when the host turns a player away for taking a name already in play.
 *
 * The name is how the room tells players apart, so a second player under a name
 * that is already seated would be the same person to every answer and every score.
 * The way back is a button rather than a hint to reload, because the player only has
 * to change one thing to get in.
 */
export function NameTakenScreen({ onBack }: NameTakenScreenProps) {
  return (
    <Stack gap="Lg" align="Stretch">
      <Text variant="Title">{Strings.join.nameTaken}</Text>
      <Banner variant="Warning">{Strings.join.nameTakenHint}</Banner>
      <Button variant="Primary" size="Large" onClick={onBack}>
        {Strings.common.back}
      </Button>
    </Stack>
  );
}
