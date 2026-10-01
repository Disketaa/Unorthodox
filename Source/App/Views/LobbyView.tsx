import { LobbyScreen } from '@/Screens';
import { GameSessionView } from '../Hooks/UseGameSession';

export interface PhaseViewProps {
  view: GameSessionView;
}

/** Lobby: room code, roster, the character picker, and the host's Start button. */
export function LobbyView({ view }: PhaseViewProps) {
  const players = view.publicState?.phase === 'Lobby' ? view.publicState.players : [];
  // The name the host has for us, not the one typed on this tab: the character is the
  // host's to keep, so the picker is headed with what the room actually calls us.
  const ownName = players.find((player) => player.id === view.playerId)?.name ?? '';
  return (
    <LobbyScreen
      roomCode={view.roomCode}
      players={players}
      ownPlayerId={view.playerId}
      ownPlayerName={ownName}
      ownLook={view.ownLook}
      isHost={view.isHost}
      onPickLook={view.setLook}
      onStart={view.startGame}
      onExit={view.exitRoom}
    />
  );
}
