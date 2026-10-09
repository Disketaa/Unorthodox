import { useState } from 'preact/hooks';
import { WritingScreen } from '@/Screens';
import { themeAccent } from '@/Core';
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
  const writing = view.publicState?.phase === 'Writing' ? view.publicState : undefined;
  const theme = writing?.theme;
  const accent = theme === undefined ? undefined : themeAccent(theme);

  return (
    <WritingScreen
      topic={writing?.topic ?? ''}
      theme={theme}
      themeAccent={accent}
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
