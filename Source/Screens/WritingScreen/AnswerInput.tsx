import { Stack, Text } from '@/Design/Primitives';
import { Keyboard, TextField, ThemeLabel } from '@/Design/Components';
import type { KeyboardKey } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface AnswerInputProps {
  /** The round's question, headed over the keys: the answer is typed into this box, so the
   * question belongs on it rather than somewhere above the card. */
  topic: string;
  /** The round's theme, which is its own name: a theme's id is the Russian word on its file, so
   * there is nothing to translate. Shown in the theme's own colours because the kind of answer
   * wanted is half of knowing what is being asked. */
  theme: string | undefined;
  /** The theme's own wash and ink. Supplied rather than looked up, because a screen is given
   * data and does not go and find it. Absent until the round's theme is known. */
  themeAccent: { wash: string; ink: string } | undefined;
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

/** What the round is asking, under the two names that frame it: the topic, and the theme it
 * comes from. Its own component because it is the one part that does not change while an answer
 * is typed, and re-rendering it on every keystroke is work for nothing. */
/** What the round is asking: the theme it was drawn from, and the question itself in that
 * theme's own colour. One component because both take their colour from the same accent, and
 * its own because it is the one part here that does not change while an answer is typed. */
function AnswerHeading({
  topic,
  theme,
  themeAccent,
}: Pick<AnswerInputProps, 'topic' | 'theme' | 'themeAccent'>) {
  if (theme === undefined || themeAccent === undefined) {
    return <Text variant="Body" fontWeight="Bold">{topic}</Text>;
  }
  return <ThemeLabel theme={theme} accent={themeAccent} topic={topic} />;
}

/** The on-screen keys under the field, which is where an answer is typed on a device with no
 * keyboard of its own. Not drawn once the answer is sent: there is nothing left to type. */
function AnswerKeys({
  value,
  canSubmit,
  timeUp,
  onValueChange,
  onSubmit,
}: Pick<
  AnswerInputProps,
  'value' | 'timeUp' | 'onValueChange' | 'onSubmit'
> & { canSubmit: boolean }) {
  return (
    <Keyboard
      disabled={timeUp}
      canSubmit={canSubmit}
      backspaceLabel={Strings.writing.backspaceKey}
      spaceLabel={Strings.writing.spaceKey}
      enterLabel={Strings.writing.enterKey}
      langLabel={Strings.writing.langKey}
      onKeyPress={(key) => pressKey(key, value, canSubmit, onValueChange, onSubmit)}
    />
  );
}

/** The single answer field of the writing phase, or the confirmation after it. */
export function AnswerInput({
  topic,
  theme,
  themeAccent,
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
      <AnswerHeading topic={topic} theme={theme} themeAccent={themeAccent} />
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
        <AnswerKeys
          value={value}
          canSubmit={canSubmit}
          timeUp={timeUp}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
        />
      )}
    </Stack>
  );
}
