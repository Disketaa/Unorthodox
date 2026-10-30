import { LobbyScreen } from '@/Screens';
import { Pace } from '@/Game';
import { savedCustomThemes, type ThemeId, type ThemeMode, type CustomTheme } from '@/Core';
import { GameSessionView } from '../Hooks/UseGameSession';
import { useCallback, useMemo } from 'preact/hooks';

export interface PhaseViewProps {
  view: GameSessionView;
}

/** This browser's themes and the room's, keyed by name, with the room's reading winning over the
 * local copy: they can only disagree where the room holds a theme this browser has since
 * edited, and there the room is what the other players are holding. */
function mergeCustomThemes(room: readonly CustomTheme[]): readonly CustomTheme[] {
  const merged = new Map(savedCustomThemes().map((theme) => [theme.name, theme]));
  for (const theme of room) merged.set(theme.name, theme);
  return [...merged.values()];
}

/** Lobby: room code, roster, the character picker, and the host's Start button. */
export function LobbyView({ view }: PhaseViewProps) {
  const players = view.publicState?.phase === 'Lobby' ? view.publicState.players : [];
  // What the host has set, which is the answer for everyone. A client that pressed a
  // pace button is shown its own preview until the host's choice arrives here.
  const pace: Pace = view.publicState?.phase === 'Lobby' ? view.publicState.pace : 'Standard';
  // How the room is given its themes, for the pace's reason: what every screen in the room deals
  // from, read off the room rather than remembered. A room whose state has not arrived reads as
  // the random bank, which is the whole set and so is what it would have been given anyway.
  const themeMode: ThemeMode =
    view.publicState?.phase === 'Lobby' ? view.publicState.themeMode : 'Random';
  const themes: readonly ThemeId[] =
    view.publicState?.phase === 'Lobby' ? view.publicState.themes : [];
  // The custom themes, merged from this browser's cache and the room's state. Memoized so a
  // re-render that changes nothing here does not hand a new array down to every lobby card.
  const customThemes: readonly CustomTheme[] = useMemo(
    () => mergeCustomThemes(view.publicState?.phase === 'Lobby' ? view.publicState.customThemes : []),
    [view.publicState?.customThemes]
  );
  // The name the host has for us, not the one typed on this tab: the character is the
  // host's to keep, so the picker is headed with what the room actually calls us.
  const ownName = players.find((player) => player.id === view.playerId)?.name ?? '';
  // Kept stable so SettingsCard → LobbyPace → LobbyThemes do not re-render on every lobby tick.
  const onLoadCustomThemes = useCallback(() => {}, []);
  return (
    <LobbyScreen
      roomCode={view.roomCode}
      players={players}
      pace={pace}
      themeMode={themeMode}
      themes={themes}
      customThemes={customThemes}
      onCustomThemes={view.setCustomThemes}
      onRemoveCustomTheme={view.removeCustomTheme}
      onLoadCustomThemes={onLoadCustomThemes}
      ownPlayerId={view.playerId}
      ownPlayerName={ownName}
      ownLook={view.ownLook}
      isHost={view.isHost}
      onPickLook={view.setLook}
      onPickPace={view.setPace}
      onPickThemes={view.setThemes}
      onStart={view.startGame}
      onExit={view.exitRoom}
      onKick={view.kickPlayer}
    />
  );
}
