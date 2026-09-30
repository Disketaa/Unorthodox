import { Stack, Text } from '@/Design/Primitives';
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
    <Stack gap="Lg" padding="Lg" align="Stretch">
      <Timer remainingMs={remainingMs} totalMs={totalMs} />
      <Text variant="Caption">{Strings.writing.topicLabel}</Text>
      <Text variant="Title">{topic}</Text>
      <Card variant="Elevated">
        <AnswerInput
          value={value}
          submitted={submitted}
          timeUp={timeUp}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
        />
      </Card>
      {timeUp && <Banner variant="Warning">{Strings.writing.timeUp}</Banner>}
      <Text variant="Caption">{Strings.writing.submittedCount(submittedCount, playerCount)}</Text>
      {submitted && <Text variant="Caption">{Strings.writing.waitForOthers}</Text>}
    </Stack>
  );
}
