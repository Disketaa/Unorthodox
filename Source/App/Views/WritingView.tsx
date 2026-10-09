import { useState } from 'preact/hooks';
import { WritingScreen } from '@/Screens';
import { useCountdown } from '../Hooks/UseCountdown';
import { PhaseViewProps } from './LobbyView';

/** Writing: topic, timer and the answer draft, which is local UI state. */
export function WritingView({ view }: PhaseViewProps) {
  const [draft, setDraft] = useState('');
  const remainingMs = useCountdown(
    view.durationMs,
    view.phaseStartedAt,
    view.clockOffsetMs,
    true,
    undefined,
    view.paused
  );
  const topic = view.publicState?.phase === 'Writing' ? view.publicState.topic : '';

  return (
    <WritingScreen
      topic={topic}
      remainingMs={remainingMs}
      value={draft}
      submitted={view.hasSubmitted}
      held={view.paused}
      onValueChange={setDraft}
      onSubmit={() => {
        view.submitAnswer(draft);
        setDraft('');
      }}
    />
  );
}
