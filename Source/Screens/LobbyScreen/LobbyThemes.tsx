import { ThemeId, ThemeMode, ThemeIds, CustomTheme } from '@/Core';
import { Separator } from '@/Design/Primitives';
import { ThemeGrid, themeLabel, ModeButtons } from './ThemeGrid';
import { PastedThemes } from './PastedThemes';
import { namedThemesRules } from './NamedThemesRules';

interface LobbyThemesProps {
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  isHost: boolean;
  onPick: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  onLoadCustomThemes: () => void;
  /** Opening the paste window on one theme's own JSON, to change that theme. The name is the
   * authored theme the custom theme has taken, and the window is opened on the theme so the
   * name can be changed there, with the banner in it saying why. */
  onEditCustomThemes: (theme: CustomTheme, clash?: string) => void;
  customThemes: readonly CustomTheme[];
}

/** The themes a room is played from: the rule over what is named, the two ways of giving it to
 * the room, and the bank's own cards. The count is the size of what the host has named, which
 * is what the bank is dealt from — a pasted theme is in that count as any other. */
export function LobbyThemes({
  themeMode,
  themes: named,
  isHost,
  onPick,
  onLoadCustomThemes,
  onEditCustomThemes,
  customThemes,
}: LobbyThemesProps) {
  const rules = namedThemesRules(themeMode, named, customThemes, onPick, onEditCustomThemes);
  const chosen: LobbyThemesProps = {
    themeMode,
    themes: named,
    isHost,
    onPick,
    onLoadCustomThemes,
    onEditCustomThemes,
    customThemes,
  };
  return (
    <>
      <Separator>
        {themeLabel(themeMode, named.length, ThemeIds.length + customThemes.length)}
      </Separator>
      <ModeButtons themeMode={themeMode} isHost={isHost} onPick={onPick} named={named} />
      {themeMode === 'Chosen' && <ChosenThemes {...chosen} full={rules.full} rules={rules} />}
    </>
  );
}

/** The bank's own cards and the host's pasted ones, both shown only once the host has said which
 * themes the room is played from. What a press means is worked out above and handed in, so this
 * is only about drawing them. */
function ChosenThemes({
  themeMode,
  themes: named,
  isHost,
  onLoadCustomThemes,
  onEditCustomThemes,
  customThemes,
  full,
  rules,
}: LobbyThemesProps & {
  full: boolean;
  rules: ReturnType<typeof namedThemesRules>;
}) {
  return (
    <>
      <ThemeGrid
        themeMode={themeMode}
        named={named}
        isHost={isHost}
        full={full}
        pick={rules.pick}
      />
      <PastedThemes
        customThemes={customThemes}
        named={named}
        isHost={isHost}
        full={full}
        onPickCustom={rules.pickCustom}
        onEditCustomThemes={onEditCustomThemes}
        onLoadCustomThemes={onLoadCustomThemes}
      />
    </>
  );
}
