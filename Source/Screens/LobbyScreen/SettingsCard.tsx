import { LobbyPace } from './LobbyPace';
import { ThemeRef, ThemeMode, CustomTheme } from '@/Core';
import { Pace } from '@/Game';

export interface SettingsCardProps {
  pace: Pace;
  themeMode: ThemeMode;
  themes: readonly ThemeRef[];
  players: number;
  isHost: boolean;
  onPickPace: (pace: Pace) => void;
  onPickThemes: (mode: ThemeMode, themes: readonly ThemeRef[]) => void;
  /** Opening the paste window without saving. */
  onLoadCustomThemes: () => void;
  /** The custom themes this room knows, so the grid can show them. */
  customThemes: readonly CustomTheme[];
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
      onLoadCustomThemes={props.onLoadCustomThemes}
      customThemes={props.customThemes}
    />
  );
}
