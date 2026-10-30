import { Screen } from '@/Design/Primitives';
import { memo } from 'preact/compat';
import { CharacterColor, CharacterId, PlayerId, ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Pace, PublicPlayer } from '@/Game';
import { RoomCard } from './RoomCard';
import { SettingsCard } from './SettingsCard';
import { LookPicker } from './LookPicker';
import { CustomThemesPopup } from './CustomThemesPopup';
import { useCustomThemesPopup } from './UseCustomThemesPopup';

export interface LobbyScreenProps {
  /** This player's own name, which titles the character picker. */
  ownPlayerName: string;
  /** This player's own character, once the host has told us which one it kept. */
  ownLook: { character: CharacterId; color: CharacterColor } | undefined;
  /** The pace the room is set to, which only the host can change. */
  pace: Pace;
  /** The themes the host has named, and which way the room is given them, which only the host
   * can change. */
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  /** The custom themes this room knows, so the popup can show them. */
  customThemes: readonly CustomTheme[];
  /** The host pasting in custom themes, which every client is then told. */
  onCustomThemes: (themes: readonly CustomTheme[]) => void;
  /** Striking one custom theme out of the room and out of this browser. */
  onRemoveCustomTheme: (name: string) => void;
  onPickLook: (character: CharacterId, color: CharacterColor) => void;
  /** Asking for a pace. The host's click changes the room; a client's is a local look at what
   * that pace would mean, and the host's choice is what comes back. */
  onPickPace: (pace: Pace) => void;
  /** Asking for a different set of themes, on the same terms as the pace: the host's click
   * changes the room and a client's changes nothing. */
  onPickThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  /** Opening the paste window without saving. */
  onLoadCustomThemes: () => void;
  roomCode: string;
  /** The players in the room. */
  players: readonly PublicPlayer[];
  /** This player's id. */
  ownPlayerId: PlayerId | null;
  /** Whether this device owns the setting. */
  isHost: boolean;
  /** Starting the game. Host only. */
  onStart: () => void;
  /** Leaving the room. */
  onExit: () => void;
  /** Kicking a player. Host only. */
  onKick: (playerId: PlayerId) => void;
}

/** Waiting room: room code, roster, character picker. */
export const LobbyScreen = memo(function LobbyScreen(props: LobbyScreenProps) {
  const popup = useCustomThemesPopup(props.onRemoveCustomTheme, props.onCustomThemes);
  return (
    <Screen>
      <RoomCard
        roomCode={props.roomCode}
        players={props.players}
        ownPlayerId={props.ownPlayerId}
        isHost={props.isHost}
        onStart={props.onStart}
        onExit={props.onExit}
        onKick={props.onKick}
        themeMode={props.themeMode}
        themes={props.themes}
      />
      <SettingsCard
        {...props}
        players={props.players.length}
        onLoadCustomThemes={popup.openBlank}
        onEditCustomThemes={popup.openOn}
      />
      {props.ownLook !== undefined && (
        <LookPicker
          ownName={props.ownPlayerName}
          ownLook={props.ownLook}
          onPick={props.onPickLook}
        />
      )}
      <CustomThemesPopup
        open={popup.open}
        json={popup.json}
        problem={popup.problem}
        themeName={popup.themeName}
        onClose={popup.close}
        onDelete={popup.remove}
        onSave={popup.save}
      />
    </Screen>
  );
});
