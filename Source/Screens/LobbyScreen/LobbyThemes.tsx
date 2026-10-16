import { ThemeRef, ThemeMode, CustomTheme } from '@/Core';
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
  customThemes,
}: {
  themeMode: ThemeMode;
  themes: readonly ThemeRef[];
  isHost: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeRef[]) => void;
  onLoadCustomThemes: () => void;
  customThemes: readonly CustomTheme[];
}) {
  // The count is the size of what the host has named, which is what the bank is dealt from. The
  // pasted themes are in the same count as any other: a custom theme is named like an authored one
  // or it is not named at all, and it stops counting the bank whether or not the host pressed it.
  const full = themeMode === 'Chosen' && named.length >= ThemeLimit;
  return (
    <>
      <Separator>{themeLabel(themeMode, named.length)}</Separator>
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
            <Button
              variant="Info"
              disabled={!isHost}
              onClick={() => onLoadCustomThemes()}
            >
              {Strings.lobby.settings.loadCustomThemes}
            </Button>
          </Stack>
          <CustomThemeGrid
            customThemes={customThemes}
            named={named}
            isHost={isHost}
            full={full}
            onPick={onPick}
          />
        </>
      )}
    </>
  );
}
