import { Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';

/** The row that ends the window: cancel, or remove when the box is empty, otherwise save. */
export function ActionRow({
  onClose,
  onSave,
  onDelete,
  emptied,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  emptied: boolean;
  disabled: boolean;
}) {
  return (
    <>
      <Separator />
      <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
        <Button variant="Muted" onClick={onClose}>
          {Strings.lobby.settings.customThemesCancel}
        </Button>
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
    </>
  );
}
