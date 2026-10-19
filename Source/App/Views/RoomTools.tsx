import {
  LobbyDebugTools,
  PauseDebugTools,
  PhaseDebugTools,
  ReloadDebugTools,
  TurnDebugTools,
} from '@/Screens';
import { DebugDock } from '@/Design/Overlays';
import type { GameSessionView } from '../Hooks/UseGameSession';
import { useAnswerFlush } from '../Hooks/UseAnswerFlush';

/** The skip, with the answer field given its say first. The order is the whole of it: an answer
 * sent after the room has left writing is dropped by the host, so a draft flushed afterwards is
 * one nobody ever sees and the room stays a card short all game. */
export function useSkipPhase(view: GameSessionView): () => void {
  const flush = useAnswerFlush();
  return () => {
    flush.flush();
    view.nextPhase();
  };
}

/** The host's hand on the room, in one dock and out of the room that draws the game. */
export function RoomDebugTools({ view, enabled }: { view: GameSessionView; enabled: boolean }) {
  const skip = useSkipPhase(view);
  return (
    <DebugDock enabled={enabled}>
      {view.isHost && (
        <>
          <LobbyDebugTools publicState={view.publicState} onAddBot={view.addBot} />
          <TurnDebugTools publicState={view.publicState} onNextTurn={view.nextTurn} />
          {/* Holding the room is a thing done to a game in progress. In the lobby there is no
           * clock under it to stop, and the dock there is already four buttons of settings. */}
          {view.phase !== 'Lobby' && view.phase !== 'Connecting' && (
            <PauseDebugTools paused={view.paused} onSetPaused={view.setPaused} />
          )}
          <PhaseDebugTools publicState={view.publicState} onNextPhase={skip} />
          {/* Beside the skip and not under the pause: a reload is a step in its own right, and a
           * host watching a room move wants it next to the step out rather than next to the stop. */}
          <ReloadDebugTools publicState={view.publicState} onReloadPhase={view.reloadPhase} />
        </>
      )}
    </DebugDock>
  );
}
