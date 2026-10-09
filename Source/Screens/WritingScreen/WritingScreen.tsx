import { Screen } from '@/Design/Primitives';
import { Card } from '@/Design/Components';
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
  /** How long the phase runs for, which is what the question is measured against as it drains. */
  durationMs: number;
value: string;
  /** Whether the host is holding the room, which stops the answer being sent. */
  held: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

/** Writing phase: the question, the answer field, and the keys that write it. What the room is
 * waiting for is not said in a line of its own — the answer itself turns yellow once it is
 * sent, which says it where the player is already looking. */
export function WritingScreen({
  topic,
  theme,
  themeAccent,
  remainingMs,
  durationMs,
  value,
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
          remainingMs={remainingMs}
          totalMs={durationMs}
          value={value}
          timeUp={timeUp}
          held={held}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
        />
      </Card>
    </Screen>
  );
}
