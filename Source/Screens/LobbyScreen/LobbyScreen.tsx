import { Screen } from '@/Design/Primitives';
import { CharacterColor, CharacterId, PlayerId, ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Pace, PublicPlayer } from '@/Game';
import { useState } from 'preact/hooks';
import { Strings } from '@/Content';
import { RoomCard } from './RoomCard';
import { SettingsCard } from './SettingsCard';
import { LookPicker } from './LookPicker';
import { CustomThemesPopup } from './CustomThemesPopup';

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
  /** The room's code. */
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
export function LobbyScreen(props: LobbyScreenProps) {
  const {
    roomCode,
    players,
    ownPlayerId,
    ownPlayerName,
    ownLook,
    isHost,
    onPickLook,
    onStart,
    onExit,
    onKick,
  } = props;
  const [popupOpen, setPopupOpen] = useState(false);
  // What the window opens on. Absent is the empty template, for adding; set to a theme's own JSON,
  // for changing that theme. Held as the text itself rather than as a flag about which it was, so
  // the body is handed exactly what it should show and there is one way to close it.
  const [popupJson, setPopupJson] = useState<string | undefined>(undefined);
  // The theme the window was opened on, kept beside the text so the window can offer to strike
  // out exactly the one it is showing rather than whatever happens to be in the box.
  const [popupTheme, setPopupTheme] = useState<CustomTheme | undefined>(undefined);
  // What the window is opened saying, where the press that opened it was refused. It is about the
  // name in the box rather than about the JSON's shape, so the body keeps it until the text is
  // touched and then goes back to reading the text itself.
  const [popupProblem, setPopupProblem] = useState<string | undefined>(undefined);
  const closePopup = (): void => {
    setPopupOpen(false);
    setPopupJson(undefined);
    setPopupTheme(undefined);
    setPopupProblem(undefined);
  };
  return (
    <Screen>
      <RoomCard
        roomCode={roomCode}
        players={players}
        ownPlayerId={ownPlayerId}
        isHost={isHost}
        onStart={onStart}
        onExit={onExit}
        onKick={onKick}
        themeMode={props.themeMode}
        themes={props.themes}
      />
      <SettingsCard
        {...props}
        players={players.length}
        onLoadCustomThemes={() => {
          setPopupJson(undefined);
          setPopupTheme(undefined);
          setPopupProblem(undefined);
          setPopupOpen(true);
        }}
        onEditCustomThemes={(theme, clash) => {
          setPopupJson(JSON.stringify(theme, null, 2));
          setPopupTheme(theme);
          setPopupProblem(
            clash === undefined ? undefined : Strings.lobby.settings.customThemesNameClash
          );
          setPopupOpen(true);
        }}
      />
      {ownLook !== undefined && (
        <LookPicker ownName={ownPlayerName} ownLook={ownLook} onPick={onPickLook} />
      )}
      <CustomThemesPopup
        open={popupOpen}
        json={popupJson}
        problem={popupProblem}
        themeName={popupTheme?.name}
        onClose={closePopup}
        onDelete={
          popupTheme === undefined
            ? undefined
            : () => {
                props.onRemoveCustomTheme(popupTheme.name);
                closePopup();
              }
        }
        onSave={(themes) => {
          // Saving a theme whose name the host changed is a rename rather than an addition: the
          // name is what the theme is keyed by, so the old one is struck out as the new one goes
          // in, or the room would end up holding both the theme as it was and the theme as it is
          // now, under two names, with the host having written only one.
          if (popupTheme !== undefined) {
            const renamed = themes.some((theme) => theme.name !== popupTheme.name);
            if (renamed) props.onRemoveCustomTheme(popupTheme.name);
          }
          props.onCustomThemes(themes);
          closePopup();
        }}
      />
    </Screen>
  );
}
