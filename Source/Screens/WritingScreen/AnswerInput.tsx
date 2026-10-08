import { Stack, Text } from '@/Design/Primitives';
import { Button, TextField } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface AnswerInputProps {
  value: string;
  submitted: boolean;
  timeUp: boolean;
  /** Whether the host is holding the room. The field stays and the draft stays, since a held
   * room has not forgotten what was typed; only the sending stops, because an answer sent into
   * a held room would be counted before the room had finished being asked. */
  held: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}

/** The single answer field of the writing phase, or the confirmation after it. */
export function AnswerInput({
  value,
  submitted,
  timeUp,
  held,
  onValueChange,
  onSubmit,
}: AnswerInputProps) {
  const canSubmit = !submitted && !timeUp && !held && value.trim().length > 0;

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
