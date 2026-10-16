import { LobbyScreen } from '@/Screens';
import { Pace } from '@/Game';
import type { ThemeId, ThemeMode } from '@/Core';
import { GameSessionView } from '../Hooks/UseGameSession';

export interface PhaseViewProps {
  view: GameSessionView;
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
  // The name the host has for us, not the one typed on this tab: the character is the
  // host's to keep, so the picker is headed with what the room actually calls us.
  const ownName = players.find((player) => player.id === view.playerId)?.name ?? '';
  return (
    <LobbyScreen
      roomCode={view.roomCode}
      players={players}
      pace={pace}
      themeMode={themeMode}
      themes={themes}
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
