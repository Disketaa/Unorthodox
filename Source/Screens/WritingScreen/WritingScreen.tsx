import { Stack, Screen, Text } from '@/Design/Primitives';
import { Card, Timer, Banner } from '@/Design/Components';
import { Strings } from '@/Content';
import { AnswerInput } from './AnswerInput';

export interface WritingScreenProps {
  topic: string;
  remainingMs: number;
  totalMs: number;
  value: string;
  submitted: boolean;
  submittedCount: number;
  playerCount: number;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

/** Writing phase: topic, timer, one answer field. */
export function WritingScreen({
  topic,
  remainingMs,
  totalMs,
  value,
  submitted,
  submittedCount,
  playerCount,
  onValueChange,
  onSubmit,
}: WritingScreenProps) {
  const timeUp = remainingMs <= 0;

  return (
    <Screen>
      <Timer remainingMs={remainingMs} totalMs={totalMs} />
      <Stack gap="Lg" align="Stretch">
        <Text variant="Caption">{Strings.writing.topicLabel}</Text>
        <Text variant="Title">{topic}</Text>
      </Stack>
      <Card variant="Elevated">
        <AnswerInput
          value={value}
          submitted={submitted}
          timeUp={timeUp}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
        />
      </Card>
      <Stack gap="Md" align="Stretch">
        {timeUp && <Banner variant="Warning">{Strings.writing.timeUp}</Banner>}
        <Text variant="Caption">{Strings.writing.submittedCount(submittedCount, playerCount)}</Text>
        {submitted && <Text variant="Caption">{Strings.writing.waitForOthers}</Text>}
      </Stack>
    </Screen>
  );
}
