/** The body of the custom themes popup: JSON text area, color row, title, and buttons. */
import { useState } from 'preact/hooks';
import { Banner, Button } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings, themePrompt } from '@/Content';
import {
  CustomTheme,
  Accents,
  normalizeCustomThemesJson,
  parseCustomThemesJson,
  customThemesJsonError,
  hasJsonFence,
  type CustomThemesError,
} from '@/Core';
import { SyntaxHighlightedJson } from './CustomThemesPopupSyntax';
import styles from './CustomThemesPopup.module.css';

export function CustomThemesPopupBody({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (themes: readonly CustomTheme[]) => void;
}) {
  const [json, setJson] = useState(DefaultJson);
  const [copyFailed, setCopyFailed] = useState(false);

  const themes = parseCustomThemesJson(json);
  // A theme with no valid JSON behind it has no name to show, so the window says what it is
  // instead: the error, in the error's own colour.
  const invalid = themes === undefined;
  const title = invalid
    ? Strings.lobby.settings.customThemesErrorTitle
    : (themes[0]?.name ?? Strings.lobby.settings.customThemesTitle);
  const titleColor = invalid
    ? 'var(--Color-Feedback-Error)'
    : (themes[0]?.color ? Accents[themes[0].color].tint : undefined);

  const repair = (text: string): string | undefined =>
    parseCustomThemesJson(text) === undefined
      ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName)
      : undefined;

  const handlePaste = (text: string): string | undefined =>
    // A fence is taken off even when the JSON inside it is already fine, so the box shows the
    // theme rather than the backticks it was copied with.
    hasJsonFence(text) ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName) : repair(text);

  const handleSave = (): void => {
    if (themes === undefined) {
      const repaired = repair(json);
      const rescued = repaired === undefined ? undefined : parseCustomThemesJson(repaired);
      // Repair and save in one go, so a host who typed a near miss does not have to press the
      // button twice to find out whether it took. The banner already says why it would not take.
      if (repaired === undefined || rescued === undefined) return;
      setJson(repaired);
      onSave(rescued);
      return;
    }
    onSave(themes);
  };

  const valid = themes !== undefined;
  // The banner reads the text rather than the save button, so the host is told what is wrong
  // while they are fixing it, not after they have gone looking for it.
  const error = errorText(customThemesJsonError(json));

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
        <SyntaxHighlightedJson
          json={json}
          onChange={setJson}
          onPaste={handlePaste}
          color={titleColor}
          invalid={!valid}
          label={Strings.lobby.settings.customThemes}
        />
        <CustomButtons
          onClose={onClose}
          onSave={handleSave}
          onCopyPrompt={() => void handleCopyPrompt()}
          disabled={!valid}
        />
      </div>
    </div>
  );
}

/** The banner's wording. A syntax error keeps the parser's own message, which points at the
 * character and the line; a shape error is the requirement stated. */
function errorText(problem: CustomThemesError | undefined): string | undefined {
  if (problem === undefined) return undefined;
  return problem.kind === 'syntax'
    ? `${Strings.lobby.settings.customThemesError}: ${problem.message}`
    : Strings.lobby.settings.customThemesInvalidTheme;
}

function PopupTitle({
  title,
  color,
}: {
  title: string;
  color: string | undefined;
}) {
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
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  onCopyPrompt: () => void;
  disabled: boolean;
}) {
  return (
    <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
      <Button variant="Info" onClick={onCopyPrompt}>
        {Strings.lobby.settings.customThemesCopyPrompt}
      </Button>
      <Button variant="Muted" onClick={onClose}>{Strings.lobby.settings.customThemesCancel}</Button>
      <Button variant="Primary" disabled={disabled} onClick={onSave}>{Strings.lobby.settings.customThemesSave}</Button>
    </Stack>
  );
}

/** The default text shown in the text area: one theme with a name, a tint, and two questions.
 * The id is auto-assigned when saved. */
const DefaultJson = `{
  "id": 1,
  "name": "Польз. 1",
  "color": "Yellow",
  "questions": [
    "Вопрос 1",
    "Вопрос 2"
  ]
}`;
