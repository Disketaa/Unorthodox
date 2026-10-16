/** The host pasting in custom themes: a window over the lobby with JSON text area, save and
 * cancel buttons. Host only. */
import { useState } from 'preact/hooks';
import { Button } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { CustomTheme, isCustomTheme } from '@/Core';

export interface CustomThemesPopupProps {
  /** Whether the window is open. */
  open: boolean;
  /** Closing the window without saving. */
  onClose: () => void;
  /** Saving the pasted themes and closing the window. Host only. */
  onSave: (themes: readonly CustomTheme[]) => void;
}

/** The default text shown in the text area: one theme with a name, a tint, and two empty
 * questions the host fills in. */
const DefaultJson = `{
  "name": "Работа",
  "color": "Yellow",
  "questions": [
    "",
    ""
  ]
}`;

/** The window over the lobby: a shade behind it like the pause screen, a panel in the middle
 * with a text area for the JSON, and two buttons underneath. The host pastes, presses save, and
 * the themes go to every screen in the room. */
export function CustomThemesPopup({ open, onClose, onSave }: CustomThemesPopupProps) {
  if (!open) return null;
  return <CustomThemesPopupBody onClose={onClose} onSave={onSave} />;
}

function CustomThemesPopupBody({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (themes: readonly CustomTheme[]) => void;
}) {
  const [json, setJson] = useState(DefaultJson);
  const [error, setError] = useState<string | undefined>();

  const handleSave = (): void => {
    setError(undefined);
    const themes = parseCustomThemes(json);
    if (themes === undefined) {
      setError(Strings.lobby.settings.customThemesInvalidTheme);
      return;
    }
    onSave(themes);
  };

  const valid = parseCustomThemes(json) !== undefined;

  return (
    <div class="CustomThemesPopup-Root">
      <div class="CustomThemesPopup-Veil" onClick={onClose} />
      <div class="CustomThemesPopup-Panel">
        <h2 class="CustomThemesPopup-Title">{Strings.lobby.settings.customThemesTitle}</h2>
        <p class="CustomThemesPopup-Hint">{Strings.lobby.settings.customThemesPaste}</p>
        <CustomTextArea json={json} onChange={setJson} />
        {error !== undefined && <p class="CustomThemesPopup-Error">{error}</p>}
        <CustomButtons onClose={onClose} onSave={handleSave} disabled={!valid} />
      </div>
    </div>
  );
}

function parseCustomThemes(json: string): CustomTheme[] | undefined {
  let read: unknown;
  try {
    read = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (!Array.isArray(read)) return undefined;
  const themes: CustomTheme[] = [];
  for (const entry of read) {
    if (!isCustomTheme(entry)) return undefined;
    themes.push(entry);
  }
  return themes;
}

function CustomTextArea({
  json,
  onChange,
}: {
  json: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      class="CustomThemesPopup-Text"
      value={json}
      onInput={(event) => onChange(event.currentTarget.value)}
      spellcheck={false}
    />
  );
}

function CustomButtons({
  onClose,
  onSave,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  disabled: boolean;
}) {
  return (
    <Stack direction="Horizontal" gap="Sm" align="End" justify="End">
      <Button variant="Muted" onClick={onClose}>
        {Strings.lobby.settings.customThemesCancel}
      </Button>
      <Button variant="Primary" disabled={disabled} onClick={onSave}>
        {Strings.lobby.settings.customThemesSave}
      </Button>
    </Stack>
  );
}
