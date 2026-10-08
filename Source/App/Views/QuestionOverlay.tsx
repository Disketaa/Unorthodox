import { QuestionStage } from '@/Design/Overlays';
import { questionWords } from '@/Game';
import { themeAccent } from '@/Core';
import { Strings } from '@/Content';
import { useQuestionReveal } from '../Hooks/UseQuestionReveal';
import type { PhaseViewProps } from './LobbyView';

/** The round's question, arriving word by word in the room under the bar of players. The whole
 * question is laid down and only the words not yet read are kept out of it, so a word arriving
 * does not shove the rest of the sentence along. */
export function QuestionOverlay({ view }: PhaseViewProps) {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const theme = choosing?.theme;
  const revealed = useQuestionReveal(
    choosing?.question,
    choosing?.questionAt,
    view.clockOffsetMs,
    view.paused
  );
  const words = questionWords(choosing?.question ?? '');
  if (revealed === 0 || theme === undefined) return null;
  return (
    <QuestionStage
      words={words}
      revealed={revealed}
      label={Strings.themes.names[theme]}
      accent={themeAccent(theme)}
    />
  );
}
