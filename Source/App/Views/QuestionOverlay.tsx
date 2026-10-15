import { EnchantedArrivalMs, QuestionStage } from '@/Design/Overlays';
import { questionRevealMs, questionWords } from '@/Game';
import { themeAccent } from '@/Core';
import { useQuestionReveal } from '../Hooks/UseQuestionReveal';
import { useQuestionRemaining } from '../Hooks/UseQuestionRemaining';
import { enchantmentOf } from './EffectLabels';
import { enchantmentArriving } from './EnchantedNotice';
import type { PhaseViewProps } from './LobbyView';

/** The round's question, arriving word by word in the room under the bar of players. Every word
 * is laid down and only those not yet read are kept out of it, so a word arriving does not
 * shove the rest of the sentence along. */
export function QuestionOverlay({ view }: PhaseViewProps) {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const theme = choosing?.theme;
  const revealed = useQuestionReveal(
    choosing?.question,
    choosing?.questionAt,
    view.clockOffsetMs,
    view.paused
  );
  const remaining = useQuestionRemaining(
    choosing?.question,
    choosing?.questionAt,
    view.clockOffsetMs,
    view.paused
  );
  const words = questionWords(choosing?.question ?? '');
  if (revealed === 0 || theme === undefined) return null;
  // The word is on the window for the opening of the reveal and the bar waits exactly as long,
  // read off the same length the overlay animates for: a bar arriving on its own schedule would
  // come in over the top of the word it belongs to.
  const arriving = enchantmentArriving(view, choosing);
  const said =
    arriving && remaining <= questionRevealMs(choosing?.question ?? '') - EnchantedArrivalMs;
  const enchantment = enchantmentOf(view.roomCode, theme, choosing?.spent);
  return (
    <QuestionStage
      words={words}
      revealed={revealed}
      label={theme}
      accent={themeAccent(theme)}
      // Off entirely before the word has gone rather than drawn dark and brought in: nobody ever
      // sees the bar before the thing it belongs to has been said.
      note={said ? enchantment.note : undefined}
      glinted
    />
  );
}
