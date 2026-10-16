import { Screen } from '@/Design/Primitives';
import { CharacterColor, CharacterId, PlayerId, ThemeId, ThemeMode, CustomTheme } from '@/Core';
import { Pace, PublicPlayer } from '@/Game';
import { useState } from 'preact/hooks';
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
  const { roomCode, players, ownPlayerId, ownPlayerName, ownLook, isHost, onPickLook, onStart, onExit, onKick } = props;
  const [popupOpen, setPopupOpen] = useState(false);
  return (
    <Screen>
      <RoomCard roomCode={roomCode} players={players} ownPlayerId={ownPlayerId} isHost={isHost} onStart={onStart} onExit={onExit} onKick={onKick} themeMode={props.themeMode} themes={props.themes} />
      <SettingsCard {...props} players={players.length} onLoadCustomThemes={() => setPopupOpen(true)} />
      {ownLook !== undefined && <LookPicker ownName={ownPlayerName} ownLook={ownLook} onPick={onPickLook} />}
      <CustomThemesPopup open={popupOpen} onClose={() => setPopupOpen(false)} onSave={(themes) => { props.onCustomThemes(themes); setPopupOpen(false); }} />
    </Screen>
  );
}
