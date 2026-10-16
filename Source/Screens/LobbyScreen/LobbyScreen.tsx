import { Screen } from '@/Design/Primitives';
import { CharacterPicker } from '@/Design/Components';
import { CharacterColor, CharacterId, ThemeId, ThemeMode } from '@/Core';
import { Strings } from '@/Content';
import { Pace } from '@/Game';
import { LobbyCategory } from './LobbyCategory';
import { LobbyPace } from './LobbyPace';
import { LobbyRoom, type LobbyRoomProps } from './LobbyRoom';

export interface LobbyScreenProps extends LobbyRoomProps {
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
  onPickLook: (character: CharacterId, color: CharacterColor) => void;
  /** Asking for a pace. The host's click changes the room; a client's is a local look at what
   * that pace would mean, and the host's choice is what comes back. */
  onPickPace: (pace: Pace) => void;
  /** Asking for a different set of themes, on the same terms as the pace: the host's click
   * changes the room and a client's changes nothing. */
  onPickThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
}

/** The picker for this player's own character. In a card, so the editing area reads as one thing
 * against the roster above and the start button below. Titled with the player's own name: a
 * card headed by it is their sheet of paper. */
function LookPicker({
  ownName,
  ownLook,
  onPick,
}: {
  ownName: string;
  ownLook: { character: CharacterId; color: CharacterColor };
  onPick: (character: CharacterId, color: CharacterColor) => void;
}) {
  return (
    <LobbyCategory title={ownName}>
      <CharacterPicker
        character={ownLook.character}
        color={ownLook.color}
        labels={{
          character: Strings.characters.names,
          color: Strings.characters.colors,
          pickCharacter: Strings.characters.pickCharacter,
          customize: Strings.characters.customize,
        }}
        onPick={onPick}
      />
    </LobbyCategory>
  );
}

/** The room's own settings, on the one card: the pace with what it costs in seconds, and the
 * themes the bank will be dealt from. One card rather than two, since a player joining is
 * answered both questions on the sheet they were handed. */
function SettingsCard({
  pace,
  themeMode,
  themes,
  players,
  isHost,
  onPickPace,
  onPickThemes,
}: Pick<
  LobbyScreenProps,
  'pace' | 'themeMode' | 'themes' | 'isHost' | 'onPickPace' | 'onPickThemes'
> & {
  players: number;
}) {
  return (
    <LobbyPace
      pace={pace}
      themeMode={themeMode}
      themes={themes}
      players={players}
      isHost={isHost}
      onPick={onPickPace}
      onPickThemes={onPickThemes}
    />
  );
}

/** Waiting room: the room code, the roster, and the character picker. */
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
  return (
    <Screen>
      <LobbyRoom
        roomCode={roomCode}
        players={players}
        ownPlayerId={ownPlayerId}
        isHost={isHost}
        onStart={onStart}
        onExit={onExit}
        onKick={onKick}
      />
      <SettingsCard {...props} players={players.length} />
      {ownLook !== undefined && (
        <LookPicker ownName={ownPlayerName} ownLook={ownLook} onPick={onPickLook} />
      )}
    </Screen>
  );
}
