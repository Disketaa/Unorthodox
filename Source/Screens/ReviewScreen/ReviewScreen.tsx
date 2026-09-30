import { Stack, Text } from '@/Design/Primitives';
import { Card, Timer, VoteButton } from '@/Design/Components';
import { Strings } from '@/Content';

export interface ReviewGroup {
  groupId: number;
  text: string;
  playerCount: number;
  voted: boolean;
}

export interface ReviewScreenProps {
  topic: string;
  remainingMs: number;
  totalMs: number;
  groups: readonly ReviewGroup[];
  onReject: (groupId: number) => void;
}

/** Reviewing phase: all answers at once, duplicates grouped, everyone can reject. */
export function ReviewScreen({ topic, remainingMs, totalMs, groups, onReject }: ReviewScreenProps) {
  return (
    <Stack gap="Lg" padding="Lg" align="Stretch">
      <Timer remainingMs={remainingMs} totalMs={totalMs} />
      <Text variant="Caption">{Strings.reviewing.topicLabel}</Text>
      <Text variant="Title">{topic}</Text>
      <Text variant="Caption">{Strings.reviewing.rejectHint}</Text>
      <Stack gap="Sm">
        {groups.map((group) => (
          <Card key={group.groupId} variant="Outlined">
            <Stack direction="Horizontal" gap="Md" align="Center" justify="Between">
              <Stack gap="Xs">
                <Text variant="Body">{group.text}</Text>
                <Text variant="Caption">{Strings.reviewing.answersCount(group.playerCount)}</Text>
                <Text variant="Caption">
                  {group.voted ? Strings.reviewing.voted : Strings.reviewing.notVoted}
                </Text>
              </Stack>
              <VoteButton voted={group.voted} onVote={() => onReject(group.groupId)} />
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
