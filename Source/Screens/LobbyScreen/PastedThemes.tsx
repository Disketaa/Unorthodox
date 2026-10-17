/** The themes a host has pasted in, and the way to paste more: their own grid under their own
 * rule, and the one button that opens the window. Separate from the bank above it because the
 * two are chosen by different rules — the bank is named off a row, these are brought in. */
import { ThemeId, CustomTheme } from '@/Core';
import { Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { CustomThemeGrid } from './ThemeGrid';

export function PastedThemes({
  customThemes,
  named,
  isHost,
  full,
  onPickCustom,
  onEditCustomThemes,
  onLoadCustomThemes,
}: {
  customThemes: readonly CustomTheme[];
  named: readonly ThemeId[];
  isHost: boolean;
  full: boolean;
  onPickCustom: (theme: CustomTheme) => void;
  /** Opening the paste window on one theme's own JSON, to change that theme. The name is the
   * authored theme the custom theme has taken, and the window is opened on the theme so the
   * name can be changed there, with the banner in it saying why. */
  onEditCustomThemes: (theme: CustomTheme, clash?: string) => void;
  onLoadCustomThemes: () => void;
}) {
  return (
    <>
      <Separator>{Strings.lobby.settings.customThemes}</Separator>
      <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
        <Button variant="Info" disabled={!isHost} onClick={() => onLoadCustomThemes()}>
          {Strings.lobby.settings.loadCustomThemes}
        </Button>
      </Stack>
      <CustomThemeGrid
        customThemes={customThemes}
        named={named}
        isHost={isHost}
        full={full}
        onPickCustom={onPickCustom}
        onEdit={onEditCustomThemes}
      />
    </>
  );
}
