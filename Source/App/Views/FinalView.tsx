import { FinalScreen } from '@/Screens';
import { toScoreEntries } from '../Rankings';
import { PhaseViewProps } from './LobbyView';

/** Final ranking after the last round. */
export function FinalView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Final' ? view.publicState : undefined;

  return (
    <FinalScreen
      scores={toScoreEntries(state?.scores ?? [], view.playerNames)}
      isHost={view.isHost}
      onPlayAgain={view.playAgain}
    />
  );
}
