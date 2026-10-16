import { useEffect, useState } from 'preact/hooks';
import { WritingScreen } from '@/Screens';
import { themeAccent, themeName, type ThemeId } from '@/Core';
import { useCountdown } from '../Hooks/UseCountdown';
import { useAnswerFlush } from '../Hooks/UseAnswerFlush';
import { enchantmentOf, type Enchantment } from './EffectLabels';
import { PhaseViewProps } from './LobbyView';
import type { PublicRoom } from '@/Game';

/** Whether the round's enchanted card has reached this player, which is what the answer field
 * and the bar over the keys wear the glint for. */
function glintedFor(view: PhaseViewProps['view']): boolean {
  return (
    view.playerId !== null &&
    (view.publicState?.affectedPlayerIds?.includes(view.playerId) ?? false)
  );
}

/** What the round's enchantment asks of this player, which is nothing at all unless the card
 * reached them: the roll is the room's, but a player it did not touch is not held to it, so the
 * bar and the marked keys stay off their screen rather than showing a round they are not in. */
function enchantmentFor(
  view: PhaseViewProps['view'],
  theme: ThemeId | undefined,
  spent: PublicRoom['spent'] | undefined
) {
  if (!glintedFor(view)) return NoEnchantment;
  return enchantmentOf(view.roomCode, theme, spent);
}

/** What a round with nothing asked of this player gives the screen. */
const NoEnchantment: Enchantment = {
  note: undefined,
  banned: new Set<string>(),
  required: new Set<string>(),
  bound: undefined,
  mult: undefined,
};

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
  flush.publish(() => {
    if (draft.trim().length > 0) view.submitAnswer(draft);
  });
  useEffect(() => () => flush.publish(), [flush]);
  const enchantment = enchantmentFor(view, theme, writing?.spent);

  return (
    <WritingScreen
      topic={writing?.topic ?? ''}
      theme={theme === undefined ? undefined : themeName(theme)}
      themeAccent={theme === undefined ? undefined : themeAccent(theme)}
      remainingMs={remainingMs}
      durationMs={view.durationMs}
      value={draft}
      held={view.paused}
      onValueChange={setDraft}
      onSubmit={() => view.submitAnswer(draft)}
      onEditing={view.setEditing}
      glinted={glintedFor(view)}
      enchantment={enchantment.note}
      mult={enchantment.mult}
      bannedLetters={enchantment.banned}
      requiredLetters={enchantment.required}
      bound={enchantment.bound}
    />
  );
}
