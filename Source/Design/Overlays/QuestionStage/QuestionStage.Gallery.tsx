import { QuestionStage } from './QuestionStage';

/** The question as the room reads it: a few words in, and the whole of it standing there. Shown
 * on its own, since it is a full-viewport overlay the gallery would lose under everything else. */
export function QuestionStageGallery() {
  const words = ['Красные', 'ягоды'];
  const long = ['Фильм', 'с', 'Леонардо', 'Ди', 'Каприо'];
  return (
    <>
      <QuestionStage
        words={words}
        revealed={1}
        label="Природа"
        accent={{ wash: '#f2f7ec', ink: '#577d2e' }}
      />
      <QuestionStage
        words={long}
        revealed={long.length}
        label="Кино"
        accent={{ wash: '#fdf0ef', ink: '#ba5346' }}
      />
    </>
  );
}
