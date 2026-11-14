import { LobbyPace } from './LobbyPace';
import { ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Pace, ScoringMode } from '@/Game';

export interface SettingsCardProps {
  pace: Pace;
  scoringMode: ScoringMode;
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  players: number;
  isHost: boolean;
  onPickPace: (pace: Pace) => void;
  onPickScoringMode: (scoringMode: ScoringMode) => void;
  onPickThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  /** Opening the paste window without saving. */
  onLoadCustomThemes: () => void;
  /** Opening the paste window on one custom theme, to change it. */
  onEditCustomThemes: (theme: CustomTheme, clash?: string) => void;
  /** The custom themes this room knows, so the grid can show them. */
  customThemes: readonly CustomTheme[];
}

/** The room's own settings, on one card: pace and themes. */
export function SettingsCard(props: SettingsCardProps) {
  return (
    <LobbyPace
      pace={props.pace}
      scoringMode={props.scoringMode}
      themeMode={props.themeMode}
      themes={props.themes}
      isHost={props.isHost}
      onPick={props.onPickPace}
      onPickScoringMode={props.onPickScoringMode}
      onPickThemes={props.onPickThemes}
      onLoadCustomThemes={props.onLoadCustomThemes}
      onEditCustomThemes={props.onEditCustomThemes}
      customThemes={props.customThemes}
    />
  );
}
