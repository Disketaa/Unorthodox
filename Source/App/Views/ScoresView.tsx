import { ScoresScreen } from '@/Screens';
import { toScoreEntries } from '../Rankings';
import { useCountdown } from '../Hooks/UseCountdown';
import { PhaseViewProps } from './LobbyView';

/** Scores for the finished round. */
export function ScoresView({ view }: PhaseViewProps) {
  const remainingMs = useCountdown(
    view.durationMs,
    view.phaseStartedAt,
    view.clockOffsetMs,
  );
  const state = view.publicState?.phase === 'Scores' ? view.publicState : undefined;

  return (
    <ScoresScreen
      remainingMs={remainingMs}
      totalMs={view.durationMs}
      scores={toScoreEntries(state?.scores ?? [], view.playerNames)}
      isHost={view.isHost}
      onNext={view.nextRound}
    />
  );
}
