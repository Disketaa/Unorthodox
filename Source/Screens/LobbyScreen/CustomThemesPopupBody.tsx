/** The body of the custom themes popup: JSON text area, color row, title, and buttons. */
import { useState } from 'preact/hooks';
import { Banner, Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { Strings, themePrompt } from '@/Content';
import {
  CustomTheme,
  Accents,
  themeNameIsTaken,
  savedCustomThemes,
  normalizeCustomThemesJson,
  parseCustomThemesJson,
  customThemesJsonError,
  hasJsonFence,
  type CustomThemesError,
} from '@/Core';
import { SyntaxHighlightedJson } from './CustomThemesPopupSyntax';
import styles from './CustomThemesPopup.module.css';

export function CustomThemesPopupBody({
  initialJson,
  initialProblem,
  initialName,
  onClose,
  onSave,
  onDelete,
}: {
  initialJson?: string;
  initialProblem?: string;
  /** The name of the theme this window was opened on, so that its own name is not read as
   * another theme having taken it. */
  initialName?: string;
  onClose: () => void;
  onSave: (themes: readonly CustomTheme[]) => void;
  onDelete?: () => void;
}) {
  // The window opens on the JSON it was opened with, read once: the body is mounted afresh every
  // time the window opens, so a later change to the prop is a change nobody is looking at rather
  // than a change that would wipe out what the host is in the middle of typing.
  const [json, setJson] = useState(initialJson ?? DefaultJson);
  const [copyFailed, setCopyFailed] = useState(false);

  const themes = parseCustomThemesJson(json);
  // A name the room already plays under cannot be a custom theme's: a theme is keyed by its name,
  // so the two would not sit beside each other but take one place. Refused here as well as on the
  // card in the lobby, because this is where the name is written.
  const clash =
    themes?.[0] !== undefined &&
    themeNameIsTaken(themes[0].name, savedCustomThemes(), initialName)
      ? Strings.lobby.settings.customThemesNameClash
      : undefined;
  // A theme with no valid JSON behind it has no name to show, and neither has one whose name is
  // taken, so the window says what it is instead: the error, in the error's own colour.
  const invalid = themes === undefined || clash !== undefined;
  const title = invalid
    ? Strings.lobby.settings.customThemesErrorTitle
    : (themes[0]?.name ?? Strings.lobby.settings.customThemesTitle);
  const titleColor = invalid
    ? 'var(--Color-Feedback-Error)'
    : themes[0]?.color
      ? Accents[themes[0].color].tint
      : undefined;

  const repair = (text: string): string | undefined =>
    parseCustomThemesJson(text) === undefined
      ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName)
      : undefined;

  const handlePaste = (text: string): string | undefined =>
    // A fence is taken off even when the JSON inside it is already fine, so the box shows the
    // theme rather than the backticks it was copied with.
    hasJsonFence(text)
      ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName)
      : repair(text);

  // Save is off while the banner is showing. Every reason the banner can appear — a name the room
  // already has, JSON that does not parse, a theme that is not shaped like one — is a reason the
  // save would do something other than what the host wrote, so the button and the banner are the
  // same state read twice rather than two states that can disagree.
  const valid = themes !== undefined && clash === undefined;

  const handleSave = (): void => {
    if (clash !== undefined) return;
    if (themes === undefined) {
      const repaired = repair(json);
      const rescued = repaired === undefined ? undefined : parseCustomThemesJson(repaired);
      // Repair and save in one go, so a host who typed a near miss does not have to press the
      // button twice to find out whether it took. The banner already says why it would not take.
      if (repaired === undefined || rescued === undefined) return;
      // Repaired, and still refused if what came back takes a name the room has: the repair fixes
      // the shape of a paste, not the name the host wrote in it, and a save that quietly replaced
      // a built-in theme would be the one outcome nothing here is for.
      if (
        rescued.some((theme) => themeNameIsTaken(theme.name, savedCustomThemes(), initialName))
      )
        return;
      setJson(repaired);
      onSave(rescued);
      return;
    }
    onSave(themes);
  };
  // The banner over the copy button, split where its theme name goes: the name is the one part of
  // that sentence that is this window's own and not a fixed sentence, so it is held apart and
  // drawn in the copy button's own colour rather than lost in the wording around it. Empty while
  // the JSON has no name in it, which is what the copied prompt says about itself too.
  const [hintBefore, ...hintAfter] =
    Strings.lobby.settings.customThemesCopyPromptHint.split('{name}');
  const hintName = themes?.[0]?.name ?? '';
  const hintTail = hintAfter.join('{name}');
  // The banner reads the text rather than the save button, so the host is told what is wrong
  // while they are fixing it, not after they have gone looking for it. A reason the window was
  // opened on the way it was — the name of this theme is already a built-in one — is held until
  // the text is touched, and then the text is left to speak for itself again: the host is fixing
  // the name, and a complaint about the shape of JSON nobody has touched is a second thing to read.
  const [opened, setOpened] = useState(initialProblem);
  const error = opened ?? clash ?? errorText(customThemesJsonError(json));
  const edit = (next: string): void => {
    setOpened(undefined);
    setJson(next);
  };

  // The prompt is copied with the theme's name already in it when there is one, so the host pastes
  // it somewhere and gets a prompt about their theme rather than a prompt with a blank in it.
  const handleCopyPrompt = async (): Promise<void> => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(themePrompt(themes?.[0]?.name));
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <div class={styles.Root}>
      <div class={styles.Veil} onClick={onClose} />
      <div class={styles.Panel}>
        <div class={styles.Header}>
          <PopupTitle title={title} color={titleColor} />
          {error !== undefined && (
            <div class={styles.HeaderNote}>
              <Banner variant="Error" fill>
                {error}
              </Banner>
            </div>
          )}
          {copyFailed && (
            <div class={styles.HeaderNote}>
              <Banner variant="Error" fill>
                {Strings.lobby.settings.customThemesCopyFailed}
              </Banner>
            </div>
          )}
        </div>
        {/* How many rounds this theme can be played for, said under its name. It is the count of
         * questions in the box and nothing else: a round is dealt one question and never repeats
         * one within a theme, so the questions are the rounds, and a host who has pasted eight of
         * them is looking at a theme the room will run dry on the eighth. */}
        <Separator>
          {Strings.lobby.settings.customThemesRounds(themes?.[0]?.questions.length ?? 0)}
        </Separator>
        <SyntaxHighlightedJson
          json={json}
          onChange={edit}
          onPaste={handlePaste}
          onClear={() => edit('')}
          color={titleColor}
          invalid={!valid}
          label={Strings.lobby.settings.customThemes}
        />
        <CustomButtons
          hintBefore={hintBefore}
          hintName={hintName}
          hintTail={hintTail}
          emptied={json.trim().length === 0}
          onClose={onClose}
          onSave={handleSave}
          onCopyPrompt={() => void handleCopyPrompt()}
          onDelete={onDelete}
          disabled={!valid}
        />
      </div>
    </div>
  );
}

/** The banner's wording. A syntax error is the place first and the fault after it — `6:15, здесь
 * не может быть этого символа` — because the place is what the host looks at and the fault is
 * what they do once they are there. No "неправильный JSON" in front: the window's own title is
 * already Ошибка, and the banner repeating that spends the width the message needs. A shape
 * error is the requirement stated; a parser error is one this build cannot describe, so the
 * parser's own words are passed through. */
function errorText(problem: CustomThemesError | undefined): string | undefined {
  if (problem === undefined) return undefined;
  const settings = Strings.lobby.settings;
  if (problem.kind === 'shape') return settings.customThemesInvalidTheme;
  if (problem.kind === 'parser') return problem.message;
  const { reason, line, column } = problem.problem;
  return `${settings.customThemesJsonProblemAt(line, column)}, ${settings.customThemesJsonProblems[reason]}`;
}

function PopupTitle({ title, color }: { title: string; color: string | undefined }) {
  return (
    <span
      class={styles.title}
      style={{ color, fontFamily: 'var(--FontFamily-Display)', fontSize: 'var(--FontSize-H1)' }}
    >
      {title}
    </span>
  );
}

function CustomButtons({
  onClose,
  onSave,
  onCopyPrompt,
  onDelete,
  hintBefore,
  hintName,
  hintTail,
  emptied,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  onCopyPrompt: () => void;
  onDelete?: () => void;
  hintBefore: string;
  hintName: string;
  hintTail: string;
  emptied: boolean;
  disabled: boolean;
}) {
  return (
    /* Two rows rather than one: four buttons across a narrow panel makes each of them a word
     * wide, and the row stops being readable as the three acts it holds. The copy prompt is the
     * act that is not one of the window's own endings, so it sits above them at its own width
     * rather than among them, where it reads as a fourth way out. */
    <Stack direction="Vertical" gap="Sm" align="Stretch">
      {/* The rule between the editor and the note about the prompt. One block is about this
       * panel's own text, the other is about handing it to something else, and a column of grey
       * notes with nothing between them reads as one note said twice. */}
      <Separator>{Strings.lobby.settings.customThemesPromptSection}</Separator>
      {/* What the button below it is for, said before it is pressed rather than found out from
       * it. A host who has pasted a theme has never been told this window can hand the question
       * back the other way, and a button whose words are only its own name is a button you have
       * to guess at. */}
      <Banner variant="Muted" fill wrap>
        {hintBefore}
        <span class={styles.HintName}>{hintName}</span>
        {hintTail}
      </Banner>
      <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
        <Button variant="Info" onClick={onCopyPrompt}>
          {Strings.lobby.settings.customThemesCopyPrompt}
        </Button>
      </Stack>
      {/* An empty rule above the row that ends the window, so the two ways out of it — keep and
       * cancel — are held apart from everything above. The line is there and not the words: the
       * row it introduces already says which act is which, and a label up here would be a third
       * thing to read before deciding. */}
      <Separator />
      <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
        <Button variant="Muted" onClick={onClose}>
          {Strings.lobby.settings.customThemesCancel}
        </Button>
        {/* Emptying the box is how a theme is struck out, so the button that ends the window says
         * which of the two it will do. Saving a theme that is no longer in the box would be
         * saving nothing, and a fourth button reading "Удалить" beside the others is one more
         * thing to choose between — a host emptying the box is already saying what they mean. */}
        {emptied && onDelete !== undefined ? (
          <Button variant="Error" onClick={onDelete}>
            {Strings.lobby.settings.customThemesRemove}
          </Button>
        ) : (
          <Button variant="Primary" disabled={disabled} onClick={onSave}>
            {Strings.lobby.settings.customThemesSave}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

/** The default text shown in the text area: one theme with a name, a tint, and two questions. No
 * id: a number written into the template would be the same number every time the window is
 * opened on it, and a theme that carried it would land on whatever theme already held that
 * number. Left out, the number is picked at save time as the next free one. */
const DefaultJson = `{
  "name": "Без названия",
  "color": "Yellow",
  "questions": [
    "Вопрос 1",
    "Вопрос 2"
  ]
}`;
