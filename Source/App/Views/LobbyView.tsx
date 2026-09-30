import { LobbyScreen } from '@/Screens';
import { GameSessionView } from '../Hooks/UseGameSession';

export interface PhaseViewProps {
  view: GameSessionView;
}

/** Lobby: room code, roster and the host's Start button. */
export function LobbyView({ view }: PhaseViewProps) {
  const players = view.publicState?.phase === 'Lobby' ? view.publicState.players : [];
  return (
    <LobbyScreen
      roomCode={view.roomCode}
      players={players}
      isHost={view.isHost}
      onStart={view.startGame}
    />
  );
}
