import { Stack, Text } from '@/Design/Primitives';
import { Button, Keyboard, TextField } from '@/Design/Components';
import type { KeyboardKey } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface AnswerInputProps {
  /** The round's question, headed over the keys: the answer is typed into this box, so the
   * question belongs on it rather than somewhere above the card. */
  topic: string;
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

/** A key's effect on the draft, or on the room when the key sends it. The field is the only
 * place the draft lives, so the keyboard only reports what was pressed, and an answer sent from
 * enter is the same send as the button under the keys. */
function pressKey(
  key: KeyboardKey,
  value: string,
  canSubmit: boolean,
  onValueChange: (value: string) => void,
  onSubmit: () => void,
): void {
  if (key === 'Enter') {
    if (canSubmit) onSubmit();
    return;
  }
  if (key === 'Backspace') {
    onValueChange(value.slice(0, -1));
    return;
  }
  if (key === 'Space') {
    if (value.length >= GameConfig.limits.answerMaxLength) return;
    onValueChange(value + ' ');
    return;
  }
  if (value.length >= GameConfig.limits.answerMaxLength) return;
  onValueChange(value + key);
}

/** The single answer field of the writing phase, or the confirmation after it. */
export function AnswerInput({
  topic,
  value,
  submitted,
  timeUp,
  held,
  onValueChange,
  onSubmit,
}: AnswerInputProps) {
  const canSubmit = !submitted && !timeUp && !held && value.trim().length > 0;
  const maxLength = GameConfig.limits.answerMaxLength;

  return (
    <Stack gap="Md">
      <Text variant="Caption">{Strings.writing.topicLabel}</Text>
      <Text variant="Topic">{topic}</Text>
      {submitted ? (
        <Text variant="Body">{Strings.writing.submitted}</Text>
      ) : (
        <TextField
          value={value}
          placeholder={Strings.writing.answerPlaceholder}
          maxLength={maxLength}
          disabled={timeUp}
          onChange={onValueChange}
        />
      )}
      {!submitted && (
        <Keyboard
          disabled={timeUp}
          backspaceLabel={Strings.writing.backspaceKey}
          enterLabel={Strings.writing.enterKey}
          onKeyPress={(key) => pressKey(key, value, canSubmit, onValueChange, onSubmit)}
        />
      )}
      <Button variant="Primary" size="Large" disabled={!canSubmit} onClick={onSubmit}>
        {Strings.writing.submitButton}
      </Button>
    </Stack>
  );
}
