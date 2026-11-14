import { LobbyScreen } from '@/Screens';
import { savedCustomThemes, type CustomTheme } from '@/Core';
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

function useLobbyData(view: GameSessionView) {
  const lobby = view.publicState?.phase === 'Lobby' ? view.publicState : undefined;
  const customThemes: readonly CustomTheme[] = useMemo(
    () => mergeCustomThemes(lobby?.customThemes ?? []),
    [lobby?.customThemes]
  );
  return {
    players: lobby?.players ?? [],
    pace: lobby?.pace ?? 'Standard',
    scoringMode: lobby?.scoringMode ?? 'Smart',
    themeMode: lobby?.themeMode ?? 'Random',
    themes: lobby?.themes ?? [],
    customThemes,
  };
}

/** Lobby: room code, roster, the character picker, and the host's Start button. */
export function LobbyView({ view }: PhaseViewProps) {
  const { players, pace, scoringMode, themeMode, themes, customThemes } = useLobbyData(view);
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
      scoringMode={scoringMode}
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
      onPickScoringMode={view.setScoringMode}
      onPickThemes={view.setThemes}
      onStart={view.startGame}
      onExit={view.exitRoom}
      onKick={view.kickPlayer}
      onSetSpectator={view.setSpectator}
    />
  );
}
