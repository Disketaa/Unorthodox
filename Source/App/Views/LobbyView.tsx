import { LobbyScreen } from '@/Screens';
import { GameSessionView } from '../Hooks/UseGameSession';

export interface PhaseViewProps {
  view: GameSessionView;
}

/** Lobby: room code, roster, the character picker, and the host's Start button. */
export function LobbyView({ view }: PhaseViewProps) {
  const players = view.publicState?.phase === 'Lobby' ? view.publicState.players : [];
  return (
    <LobbyScreen
      roomCode={view.roomCode}
      players={players}
      ownPlayerId={view.playerId}
      ownLook={view.ownLook}
      isHost={view.isHost}
      onPickLook={view.setLook}
      onStart={view.startGame}
      onExit={view.exitRoom}
    />
  );
}
