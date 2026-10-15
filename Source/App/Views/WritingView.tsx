import { useEffect, useState } from 'preact/hooks';
import { WritingScreen } from '@/Screens';
import { themeAccent } from '@/Core';
import { useCountdown } from '../Hooks/UseCountdown';
import { useAnswerFlush } from '../Hooks/UseAnswerFlush';
import { PhaseViewProps } from './LobbyView';

/** Writing: topic, timer and the answer draft, which is local UI state. */
export function WritingView({ view }: PhaseViewProps) {
  const [draft, setDraft] = useState('');
  const flush = useAnswerFlush();
  const remainingMs = useCountdown(
    view.durationMs,
    view.phaseStartedAt,
    view.clockOffsetMs,
    true,
    undefined,
    view.paused,
    view.pausedAt
  );
  const writing = view.publicState?.phase === 'Writing' ? view.publicState : undefined;
  const theme = writing?.theme;
  const accent = theme === undefined ? undefined : themeAccent(theme);
  // Whether the round's enchanted card reaches this seat, read off the room's own roll rather
  // than worked out here: the host named the seats and every screen is told the same ones.
  const glinted =
    view.playerId !== null &&
    (view.publicState?.affectedPlayerIds?.includes(view.playerId) ?? false);
  // Offered to the room rather than sent here, because the only thing that can throw a draft away
  // without warning is the host's skip button. An answer nobody sent is still one they wrote: the
  // room is a card short and a seat marked finished later for it. Blank is not an answer.
  flush.publish(() => {
    if (draft.trim().length > 0) {
      view.submitAnswer(draft);
    }
  });
  // Withdrawn when this screen goes: a handler left behind belongs to the round that wrote it, and
  // pressing skip in the next one would send that round's answer again into the round now on
  // screen. The value it holds is fixed, so this runs on the way down and not on every render.
  useEffect(() => () => flush.publish(), [flush]);

  return (
    <WritingScreen
      topic={writing?.topic ?? ''}
      theme={theme}
      themeAccent={accent}
      remainingMs={remainingMs}
      durationMs={view.durationMs}
      value={draft}
      held={view.paused}
      onValueChange={setDraft}
      onSubmit={() => view.submitAnswer(draft)}
      onEditing={view.setEditing}
      glinted={glinted}
    />
  );
}
