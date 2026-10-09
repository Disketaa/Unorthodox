import { useState } from 'preact/hooks';
import { Stack, Text } from '@/Design/Primitives';
import { Keyboard, TextField, ThemeLabel } from '@/Design/Components';
import type { KeyboardKey } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';
import { playSound } from '@/Design';

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
  /** What is left of the writing phase and how long it runs for, so the question can go out with
   * the time rather than sitting there full dark while the bar counts it down. */
  remainingMs: number;
  totalMs: number;
  value: string;
  timeUp: boolean;
  /** Whether the host is holding the room. The draft stays, since a held room has not forgotten
   * what was typed, but the field closes: a round whose clock is stopped is not being written. */
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

/** What the round is asking: the theme it was drawn from, and the question itself, which goes
 * out with the time rather than sitting there full dark while the bar counts it down. Its own
 * component because it is the one part here that does not change while an answer is typed. */
function AnswerHeading({
  topic,
  theme,
  themeAccent,
  remainingMs,
  totalMs,
}: Pick<AnswerInputProps, 'topic' | 'theme' | 'themeAccent'> & {
  remainingMs: number;
  totalMs: number;
}) {
  if (theme === undefined || themeAccent === undefined) {
    return <Text variant="Body" fontWeight="Bold">{topic}</Text>;
  }
  return (
    <ThemeLabel
      theme={theme}
      accent={themeAccent}
      topic={topic}
      remainingMs={remainingMs}
      totalMs={totalMs}
    />
  );
}

/** The on-screen keys under the field, which is where an answer is typed on a device with no
 * keyboard of its own. which stay on screen after the answer is sent, since a player may change
 * their mind. */
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

/** The bar an empty answer stands in on. The font's own, so it is the height of the letters that
 * will follow it rather than a box sized to guess at it. */
const Beam = '|';

/** The words in the field, yellow once they have been sent and black again the moment anything
 * is changed. Read-only, because the keys below are how an answer is written. */
function AnswerField({
  value,
  sent,
  closed,
  onValueChange,
}: Pick<AnswerInputProps, 'value' | 'onValueChange'> & {
  sent: boolean;
  closed: boolean;
}) {
  return (
    <TextField
      variant={sent ? 'Sent' : 'Bare'}
      value={value}
      placeholder={Beam}
      maxLength={GameConfig.limits.answerMaxLength}
      disabled={closed}
      readOnly
      onChange={onValueChange}
    />
  );
}

/** The writing phase: the question above, the words in the middle, the keys under. The words
 * stay once sent and stay editable: a player who has sent an answer can change their mind, and
 * the room takes the last one they send. */
export function AnswerInput({
  topic,
  theme,
  themeAccent,
  remainingMs,
  totalMs,
  value,
  timeUp,
  held,
  onValueChange,
  onSubmit,
}: AnswerInputProps) {
  // What was last sent, and whether it has been touched since. Not a comparison of the two:
  // typing past an answer and deleting back to it would then look sent again, and words would
  // turn yellow that nobody sent.
  const [sent, setSent] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const clean = !touched && sent === value;
  // A held room is not writing: the clock is stopped for everyone, so an answer written now would
  // be timed against a round that is not running. The keys close as well as the field, since they
  // are what writes it now.
  const closed = timeUp || held;

  function change(next: string): void {
    setTouched(true);
    onValueChange(next);
  }

  function send(): void {
    setSent(value);
    setTouched(false);
    playSound('Submit');
    onSubmit();
  }

  return (
    <Stack gap="Sm">
      <AnswerHeading topic={topic} theme={theme} themeAccent={themeAccent} remainingMs={remainingMs} totalMs={totalMs} />
      <AnswerField value={value} sent={clean} closed={closed} onValueChange={change} />
      <AnswerKeys
        value={value}
        canSubmit={!closed && !clean && value.trim().length > 0}
        timeUp={closed}
        onValueChange={change}
        onSubmit={send}
      />
    </Stack>
  );
}
