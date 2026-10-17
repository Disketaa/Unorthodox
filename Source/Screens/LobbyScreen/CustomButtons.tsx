import { Banner, Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { ActionRow } from './ActionRow';
import styles from './CustomThemesPopup.module.css';

/** The copy prompt section: a section header, then the hint with the theme's name, then the copy
 * button. */
export function PromptRow({
  hintBefore,
  hintName,
  hintTail,
  onCopyPrompt,
}: {
  hintBefore: string;
  hintName: string;
  hintTail: string;
  onCopyPrompt: () => void;
}) {
  return (
    <>
      <Separator>{Strings.lobby.settings.customThemesPromptSection}</Separator>
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
    </>
  );
}

/** Two rows rather than one: four buttons across a narrow panel makes each of them a word wide,
 * and the row stops being readable as the three acts it holds. The copy prompt sits above them
 * at its own width rather than among them, where it reads as a fourth way out. */
export function CustomButtons({
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
    <Stack direction="Vertical" gap="Sm" align="Stretch">
      <PromptRow
        hintBefore={hintBefore}
        hintName={hintName}
        hintTail={hintTail}
        onCopyPrompt={onCopyPrompt}
      />
      <ActionRow
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        emptied={emptied}
        disabled={disabled}
      />
    </Stack>
  );
}
