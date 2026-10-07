import { ScoresScreen } from '@/Screens';
import { toScoreEntries } from '../Rankings';
import { PhaseViewProps } from './LobbyView';

/** Scores for the finished round. */
export function ScoresView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Scores' ? view.publicState : undefined;

  return (
    <ScoresScreen
      scores={toScoreEntries(state?.scores ?? [], view.playerNames, view.playerLooks)}
      isHost={view.isHost}
      onNext={view.nextRound}
    />
  );
}
