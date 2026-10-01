import { Stack, Text } from '@/Design/Primitives';
import { Card } from '@/Design/Components';
import { ComponentChildren } from 'preact';

export interface LobbyCategoryProps {
  /**
   * What names the group.
   *
   * Anything, not only a word: the lobby is titled by the room code, which sets its
   * own type from inside the title style rather than sitting in it.
   */
  title: ComponentChildren;
  /** The control at the title's end, such as the way out of the room. */
  action?: ComponentChildren;
  children?: ComponentChildren;
}

/**
 * The lobby's sections: a named group of things on the card.
 *
 * The same container for every section, so the room code and the player's own name
 * read as two parts of one screen rather than as two unrelated blocks.
 */
export function LobbyCategory({ title, action, children }: LobbyCategoryProps) {
  return (
    <Card variant="Elevated">
      <Stack gap="Md" align="Stretch">
        <Stack direction="Horizontal" gap="Md" align="Start" justify="Between">
          <Text variant="Title">{title}</Text>
          {action}
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
