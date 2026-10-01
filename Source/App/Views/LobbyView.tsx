import { LobbyScreen } from '@/Screens';
import { Pace } from '@/Game';
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
  // The name the host has for us, not the one typed on this tab: the character is the
  // host's to keep, so the picker is headed with what the room actually calls us.
  const ownName = players.find((player) => player.id === view.playerId)?.name ?? '';
  return (
    <LobbyScreen
      roomCode={view.roomCode}
      players={players}
      pace={pace}
      ownPlayerId={view.playerId}
      ownPlayerName={ownName}
      ownLook={view.ownLook}
      isHost={view.isHost}
      onPickLook={view.setLook}
      onPickPace={view.setPace}
      onStart={view.startGame}
      onExit={view.exitRoom}
      onKick={view.kickPlayer}
    />
  );
}
