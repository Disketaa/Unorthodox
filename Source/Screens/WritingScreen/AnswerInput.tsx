import { Stack, Text } from '@/Design/Primitives';
import { Keyboard, TextField, ThemeLabel } from '@/Design/Components';
import { pressKey } from './PressKey';
import { useSentAnswer } from './UseSentAnswer';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';
import type { LetterBound } from '@/Core';
import { demandOf, unsent, type Demand } from './Demand';

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
  /** Reports that a sent answer is being changed, which puts the player back at work in the bar
   * above. Sent as a change rather than read, because the draft this turns on is local to here. */
  onEditing?: (editing: boolean) => void;
  /** Whether the round's enchanted card reaches this player, which fills the words being written
   * with the glint. The room's own roll says who, so it is the same on every screen. */
  glinted?: boolean;
  /** The letters the round's enchanted card has banned, in both key layouts. Carried here rather
   * than looked up, so the keys strike through exactly the letters the bar above names. */
  bannedLetters?: ReadonlySet<string>;
  /** The letters the enchantment insists on, in both layouts: marked on the keys and held
   * against the send, so the answer cannot go out without one of them. */
  requiredLetters?: ReadonlySet<string>;
  /** The length the enchantment holds the answer to, held against the send the same way a
   * demanded letter is. Absent where the round asks nothing about how long it is. */
  bound?: LetterBound;
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
}: Pick<AnswerInputProps, 'topic' | 'theme' | 'themeAccent' | 'remainingMs' | 'totalMs'>) {
  if (theme === undefined || themeAccent === undefined) {
    return (
      <Text variant="Body" fontWeight="Bold">
        {topic}
      </Text>
    );
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
  bannedLetters,
  requiredLetters,
  onValueChange,
  onSubmit,
}: Pick<
  AnswerInputProps,
  'value' | 'timeUp' | 'bannedLetters' | 'requiredLetters' | 'onValueChange' | 'onSubmit'
> & {
  canSubmit: boolean;
}) {
  return (
    <Keyboard
      disabled={timeUp}
      canSubmit={canSubmit}
      banned={bannedLetters}
      required={requiredLetters}
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

/** The words in the field: yellow once sent, ink the rest of the time, and wearing the round's
 * glint whenever the room will not take the draft РІР‚вЂќ the same question the send key answers,
 * said in the same breath. No pink under it: the words say so by being lit up. */
function AnswerField({
  value,
  sent,
  closed,
  glinted,
  unmet,
  onValueChange,
}: Pick<AnswerInputProps, 'value' | 'onValueChange'> & {
  sent: boolean;
  closed: boolean;
  glinted: boolean;
  unmet: Demand;
}) {
  return (
    <TextField
      variant={sent ? 'Sent' : 'Bare'}
      value={value}
      placeholder={Beam}
      maxLength={GameConfig.limits.answerMaxLength}
      disabled={closed}
      readOnly
      glinted={glinted && unsent(unmet)}
      onChange={onValueChange}
    />
  );
}

/** The writing phase: the question above, the words in the middle, the keys under. The words
 * stay once sent and stay editable: a player who has sent an answer can change their mind, and
 * the room takes the last one they send. */
export function AnswerInput(props: AnswerInputProps) {
  const { value, timeUp, held, requiredLetters, bannedLetters, glinted = false } = props;
  // A held room is not writing: the clock is stopped, so the field and the keys both close.
  const closed = timeUp || held;
  const { clean, change, send } = useSentAnswer(
    value,
    props.onValueChange,
    props.onSubmit,
    props.onEditing
  );
  const { topic, theme, themeAccent, remainingMs, totalMs } = props;
  const heading = { topic, theme, themeAccent, remainingMs, totalMs };
  const unmet = demandOf(value, requiredLetters, props.bound);
  // The same gate as an empty answer: the send key is dead until the draft is something the room
  // will accept, and a demand the draft does not meet is not that.
  const ready = value.trim().length > 0 && !unsent(unmet);
  const field = {
    value,
    sent: clean,
    closed,
    glinted,
    unmet,
    onValueChange: change,
  };
  // The demanded letters stop being marked the moment the draft carries one of them: green says
  // "still owed", and leaving it on keys the answer has already satisfied would leave the room
  // asking for a letter it already has. Take the letter back out and the marks come back with it.
  const keys = {
    value,
    timeUp: closed,
    bannedLetters,
    requiredLetters: unmet === 'Met' ? undefined : requiredLetters,
    onValueChange: change,
    onSubmit: send,
  };

  return (
    <Stack gap="Sm">
      <AnswerHeading {...heading} />
      <AnswerField {...field} />
      <AnswerKeys {...keys} canSubmit={!closed && !clean && ready} />
    </Stack>
  );
}
