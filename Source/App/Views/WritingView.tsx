import { useEffect, useState } from 'preact/hooks';
import { WritingScreen } from '@/Screens';
import { themeAccent } from '@/Core';
import { useCountdown } from '../Hooks/UseCountdown';
import { useAnswerFlush } from '../Hooks/UseAnswerFlush';
import { enchantmentOf } from './EffectLabels';
import { PhaseViewProps } from './LobbyView';

/** Whether the round's enchanted card has reached this player, which is what the answer field
 * and the bar over the keys wear the glint for. */
function glintedFor(view: PhaseViewProps['view']): boolean {
  return (
    view.playerId !== null &&
    (view.publicState?.affectedPlayerIds?.includes(view.playerId) ?? false)
  );
}

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
  const enchantment = enchantmentOf(view.roomCode, theme, writing?.spent);
  flush.publish(() => {
    if (draft.trim().length > 0) view.submitAnswer(draft);
  });
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
      glinted={glintedFor(view)}
      enchantment={enchantment.note}
      bannedLetters={enchantment.banned}
    />
  );
}
