import { ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Button } from '@/Design/Components';
import { Separator, Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { ThemeGrid, ThemeLimit, themeLabel, ModeButtons } from './ThemeGrid';

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
  themes: readonly ThemeId[];
  isHost: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  onLoadCustomThemes: () => void;
  customThemes: readonly CustomTheme[];
}) {
  const full = themeMode === 'Chosen' && named.length + customThemes.length >= ThemeLimit;
  return (
    <>
      <Separator>{themeLabel(themeMode, named.length + customThemes.length)}</Separator>
      <ModeButtons themeMode={themeMode} isHost={isHost} onPick={onPick} named={named} />
      {themeMode === 'Chosen' && (
        <>
          <ThemeGrid
            themeMode={themeMode}
            named={named}
            customThemes={customThemes}
            isHost={isHost}
            full={full}
            onPick={onPick}
          />
          <Separator>{Strings.lobby.settings.customThemes}</Separator>
          <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
            <Button
              variant="Muted"
              disabled={!isHost}
              onClick={() => onLoadCustomThemes()}
            >
              {Strings.lobby.settings.loadCustomThemes}
            </Button>
          </Stack>
        </>
      )}
    </>
  );
}
