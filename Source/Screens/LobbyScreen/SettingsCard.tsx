import { LobbyPace } from './LobbyPace';
import { ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Pace } from '@/Game';

export interface SettingsCardProps {
  pace: Pace;
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  players: number;
  isHost: boolean;
  onPickPace: (pace: Pace) => void;
  onPickThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  customThemes: readonly CustomTheme[];
  onCustomThemes: (themes: readonly CustomTheme[]) => void;
  customThemesOpen: boolean;
  onCustomThemesOpen: () => void;
  onCustomThemesClose: () => void;
}

/** The room's own settings, on one card: pace, waits, and themes. */
export function SettingsCard(props: SettingsCardProps) {
  return (
    <LobbyPace
      pace={props.pace}
      themeMode={props.themeMode}
      themes={props.themes}
      players={props.players}
      isHost={props.isHost}
      onPick={props.onPickPace}
      onPickThemes={props.onPickThemes}
      customThemes={props.customThemes}
      onCustomThemes={props.onCustomThemes}
      customThemesOpen={props.customThemesOpen}
      onCustomThemesOpen={props.onCustomThemesOpen}
      onCustomThemesClose={props.onCustomThemesClose}
    />
  );
}
