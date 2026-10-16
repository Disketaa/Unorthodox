/** The body of the custom themes popup: JSON text area, color row, title, and buttons. */
import { useState } from 'preact/hooks';
import { Button } from '@/Design/Components';
import { Stack, Text } from '@/Design/Primitives';
import { Strings } from '@/Content';
import {
  CustomTheme,
  Accents,
  CharacterColors,
  type CharacterColor,
  parseCustomThemesJson,
} from '@/Core';
import { ColorSwatch } from '@/Design/Components';
import styles from './CustomThemesPopup.module.css';

export function CustomThemesPopupBody({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (themes: readonly CustomTheme[]) => void;
}) {
  const [json, setJson] = useState(DefaultJson);
  const [error, setError] = useState<string | undefined>();

  const themes = parseCustomThemesJson(json);
  const title = themes?.[0]?.name ?? Strings.lobby.settings.customThemesTitle;
  const titleColor = themes?.[0]?.color ? Accents[themes[0].color].tint : undefined;

  const handleSave = (): void => {
    setError(undefined);
    if (themes === undefined) {
      setError(Strings.lobby.settings.customThemesInvalidTheme);
      return;
    }
    onSave(themes);
  };

  const valid = themes !== undefined;

  const pickColor = (next: CharacterColor): void => {
    const current = parseCustomThemesJson(json);
    if (current === undefined) return;
    const updated = { ...current[0], color: next };
    setJson(JSON.stringify({ ...updated, questions: updated.questions }, null, 2));
  };

  return (
    <div class={styles.Root}>
      <div class={styles.Veil} onClick={onClose} />
      <div class={styles.Panel}>
        <PopupTitle title={title} color={titleColor} />
        <ColorRow color={themes?.[0]?.color ?? 'Yellow'} onPick={pickColor} />
        <CustomTextArea json={json} onChange={setJson} />
        {error !== undefined && <p class={styles.Error}>{error}</p>}
        <CustomButtons onClose={onClose} onSave={handleSave} disabled={!valid} />
      </div>
    </div>
  );
}

function PopupTitle({ title, color }: { title: string; color: string | undefined }) {
  return <Text variant="Title" style={{ color }}>{title}</Text>;
}

function ColorRow({
  color,
  onPick,
}: {
  color: CharacterColor;
  onPick: (color: CharacterColor) => void;
}) {
  return (
    <div class={styles.Colors} role="group">
      {CharacterColors.map((name) => (
        <ColorChoice key={name} name={name} selected={name === color} onPick={onPick} />
      ))}
    </div>
  );
}

function ColorChoice({
  name,
  selected,
  onPick,
}: {
  name: CharacterColor;
  selected: boolean;
  onPick: (color: CharacterColor) => void;
}) {
  const classes = selected ? `${styles.Choice} ${styles.Chosen}` : styles.Choice;
  return (
    <button type="button" class={classes} onClick={() => onPick(name)} aria-pressed={selected} aria-label={name}>
      <ColorSwatch color={name} size="Fill" shape="Square" />
    </button>
  );
}

function CustomTextArea({ json, onChange }: { json: string; onChange: (value: string) => void }) {
  return (
    <textarea class={styles.Text} value={json} onInput={(event) => onChange(event.currentTarget.value)} spellcheck={false} />
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
      <Button variant="Muted" onClick={onClose}>{Strings.lobby.settings.customThemesCancel}</Button>
      <Button variant="Primary" disabled={disabled} onClick={onSave}>{Strings.lobby.settings.customThemesSave}</Button>
    </Stack>
  );
}

/** The default text shown in the text area: one theme with a name, a tint, and two questions.
 * The id is auto-assigned when saved. */
const DefaultJson = `{
  "id": 1,
  "name": "Custom Theme",
  "color": "Yellow",
  "questions": [
    "Question 1",
    "Question 2"
  ]
}`;
