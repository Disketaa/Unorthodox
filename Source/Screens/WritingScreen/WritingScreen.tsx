import { Screen, Text } from '@/Design/Primitives';
import { Card } from '@/Design/Components';
import { Strings } from '@/Content';
import { AnswerInput } from './AnswerInput';

export interface WritingScreenProps {
  topic: string;
  remainingMs: number;
  value: string;
  submitted: boolean;
  /** Whether the host is holding the room, which stops the answer being sent. */
  held: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

/** Writing phase: topic, timer, one answer field. */
export function WritingScreen({
  topic,
  remainingMs,
  value,
  submitted,
  held,
  onValueChange,
  onSubmit,
}: WritingScreenProps) {
  const timeUp = remainingMs <= 0;

  return (
    <Screen vertical="Bottom">
      <Card variant="Elevated">
        <AnswerInput
          topic={topic}
          value={value}
          submitted={submitted}
          timeUp={timeUp}
          held={held}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
        />
      </Card>
      {submitted && <Text variant="Caption">{Strings.writing.waitForOthers}</Text>}
    </Screen>
  );
}
