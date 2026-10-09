import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import styles from './QuestionStage.module.css';
import { ThemeLabel } from '../../Components/ThemeLabel';
import { useSwayMotion } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import swayStyles from '../../Primitives/Sway/Sway.module.css';

/** How far each word up the scale from the one before it, so a question being read out sounds
 * like a sentence rather than one note tapped out. */
const PitchStepSemitones = 2;

export interface QuestionStageProps {
  /** Every word of the question, laid down whether it has been read yet or not. */
  words: readonly string[];
  /** How many of them are read so far, counted from the first. */
  revealed: number;
  /** What the question is being asked about, written above it. */
  label: string;
  /** The theme's own two steps for that label, passed in because the design layer does not know
   * which theme a room is playing, and named for this overlay rather than for the room's player
   * accent: the label is the theme's, not whoever is in the room. */
  accent: { wash: string; ink: string };
}

/** The round's question, arriving in the room under the bar of players. The theme it was drawn
 * from is written above it in that theme's own colour, so the room can see what it is being
 * asked about before it is asked. */
export function QuestionStage({ words, revealed, label, accent }: QuestionStageProps) {
  // The last word count drawn, written while rendering so the frame a word lands on knows it was
  // the next one. A screen that joined the reveal late skips straight to several words, and stays
  // quiet rather than playing a chord for a sentence nobody watched being read.
  const heardRef = useRef(revealed);
  const step = revealed === heardRef.current + 1;
  heardRef.current = revealed;
  return (
    <div class={styles.Root}>
<div class={styles.Column}>
        <div class={styles.Heading}>
          <ThemeLabel theme={label} accent={accent} />
        </div>
        <span class={styles.Stage}>
          {words.map((word, index) => (
            <Word
              key={`${index}:${word}`}
              shown={index < revealed}
              note={step && index === revealed - 1 ? index * PitchStepSemitones : undefined}
            >
              {word}
            </Word>
          ))}
        </span>
      </div>
    </div>
  );
}

/** One word, held out of the page until its moment and then landing and swaying like everything
 * else on it, with a note on it when it is the word that just arrived. Its own box rather than
 * a bare span, since both movements are transforms and neither reaches text that has no box. */
function Word({
  children,
  shown,
  note,
}: {
  children: ComponentChildren;
  shown: boolean;
  note: number | undefined;
}) {
  const sway = useSwayMotion();
  useEffect(() => {
    if (note !== undefined) playSound('Pop', note);
  }, [note]);
  const state = shown ? styles.Word : styles.Held;
  return (
    <span class={`${styles.Mark} ${swayStyles.Moving} ${state}`} ref={sway}>
      {children}
    </span>
  );
}
