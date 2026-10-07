import { Stack, Text } from '@/Design/Primitives';
import { Button, TextField } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface AnswerInputProps {
  value: string;
  submitted: boolean;
  timeUp: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

/** The single answer field of the writing phase, or the confirmation after it. */
export function AnswerInput({
  value,
  submitted,
  timeUp,
  onValueChange,
  onSubmit,
}: AnswerInputProps) {
  const canSubmit = !submitted && !timeUp && value.trim().length > 0;

  return (
    <Stack gap="Md">
      {submitted ? (
        <Text variant="Body">{Strings.writing.submitted}</Text>
      ) : (
        <TextField
          value={value}
          placeholder={Strings.writing.answerPlaceholder}
          maxLength={GameConfig.limits.answerMaxLength}
          disabled={timeUp}
          onChange={onValueChange}
        />
      )}
      <Button variant="Primary" size="Large" disabled={!canSubmit} onClick={onSubmit}>
        {Strings.writing.submitButton}
      </Button>
    </Stack>
  );
}
