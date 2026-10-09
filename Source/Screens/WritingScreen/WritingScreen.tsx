import { Screen, Text } from '@/Design/Primitives';
import { Card } from '@/Design/Components';
import { Strings } from '@/Content';
import { AnswerInput } from './AnswerInput';

export interface WritingScreenProps {
  topic: string;
  /** The round's theme, which is its own name: a theme's id is the Russian word on its file, so
   * there is nothing to translate. Undefined before the round's theme is known, which is the
   * only time there is nothing to name. */
  theme: string | undefined;
  /** The theme's own wash and ink, for naming it. Undefined for as long as the theme is. */
  themeAccent: { wash: string; ink: string } | undefined;
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
  theme,
  themeAccent,
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
          theme={theme}
          themeAccent={themeAccent}
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
