import { Stack, Text } from '@/Design/Primitives';
import { Card } from '@/Design/Components';
import { ComponentChildren } from 'preact';

export interface LobbyCategoryProps {
  title: string;
  /** The line under the title that names or numbers the group. */
  subtitle?: ComponentChildren;
  /** The control at the title's end, such as the way out of the room. */
  action?: ComponentChildren;
  children?: ComponentChildren;
}

/**
 * The lobby's sections: a named group of things on the card.
 *
 * The same container for every section, so "Лобби" and "Персонаж" read as two parts
 * of one screen rather than as two unrelated blocks.
 */
export function LobbyCategory({ title, subtitle, action, children }: LobbyCategoryProps) {
  return (
    <Card variant="Elevated">
      <Stack gap="Md" align="Stretch">
        <Stack direction="Horizontal" gap="Md" align="Start" justify="Between">
          <Stack gap="Xs" align="Stretch">
            <Text variant="Title">{title}</Text>
            {subtitle}
          </Stack>
          {action}
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
