import { ThemeId, ThemeMode, ThemeIds, CustomTheme, themeNameIsTaken } from '@/Core';
import { Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { ThemeGrid, CustomThemeGrid, ThemeLimit, themeLabel, ModeButtons } from './ThemeGrid';

/** The themes a room is played from. */
export function LobbyThemes({
  themeMode,
  themes: named,
  isHost,
  onPick,
  onLoadCustomThemes,
  onEditCustomThemes,
  customThemes,
}: {
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  isHost: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  onLoadCustomThemes: () => void;
  /** Opening the paste window on one theme's own JSON, to change that theme. The name is the
   * authored theme the custom theme has taken, where the press that opened the window was
   * refused for that reason — the window is opened on the theme so the name can be changed
   * there, and the banner in it says why it was opened rather than why nothing happened. */
  onEditCustomThemes: (theme: CustomTheme, clash?: string) => void;
  customThemes: readonly CustomTheme[];
}) {
  // The count is the size of what the host has named, which is what the bank is dealt from. The
  // pasted themes are in the same count as any other: a custom theme is named like an authored one
  // or it is not named at all, and it stops counting the bank whether or not the host pressed it.
  const full = themeMode === 'Chosen' && named.length >= ThemeLimit;
  // A custom theme whose name is already an authored theme's cannot be named, and the press that
  // would name it opens the theme's own paste window with the reason in it. Not refused silently:
  // a card that does nothing says nothing, and not a banner down here in the room either, since
  // the fix is a name in the JSON and the window is where the name is written. The host is taken
  // to the problem rather than told about it.
  const pickCustom = (theme: CustomTheme): void => {
    if (themeNameIsTaken(theme.name, customThemes, theme.name)) {
      onEditCustomThemes(theme, theme.name);
      return;
    }
    onPick('Chosen', toggleIn(named, theme.name));
  };
  return (
    <>
      <Separator>
        {themeLabel(themeMode, named.length, ThemeIds.length + customThemes.length)}
      </Separator>
      <ModeButtons themeMode={themeMode} isHost={isHost} onPick={onPick} named={named} />
      {themeMode === 'Chosen' && (
        <>
          <ThemeGrid
            themeMode={themeMode}
            named={named}
            isHost={isHost}
            full={full}
            onPick={onPick}
          />
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
            onPickCustom={pickCustom}
            onEdit={onEditCustomThemes}
          />
        </>
      )}
    </>
  );
}

/** The theme named on or off the selection, the same press the authored cards use. Here rather
 * than in the grid so that the grid's own press is about the press and the rule about the name
 * is about the room. */
function toggleIn(named: readonly ThemeId[], theme: ThemeId): readonly ThemeId[] {
  return named.includes(theme) ? named.filter((held) => held !== theme) : [...named, theme];
}
