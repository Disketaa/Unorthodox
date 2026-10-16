import { Screen } from '@/Design/Primitives';
import { Card, EnchantmentBar } from '@/Design/Components';
import type { LetterBound } from '@/Core';
import { AnswerInput } from './AnswerInput';
import { demandOf, roundAsks, unsent } from './Demand';

export interface WritingScreenProps {
  topic: string;
  /** The round's theme, which is its own name: a theme's id is the Russian word on its file, so
   * there is nothing to translate. Undefined before the round's theme is known, which is the
   * only time there is nothing to name. */
  theme: string | undefined;
  /** The theme's own wash and ink, for naming it. Undefined for as long as the theme is. */
  themeAccent: { wash: string; ink: string } | undefined;
  remainingMs: number;
  /** How long the phase runs for, which is what the question is measured against as it drains. */
  durationMs: number;
  value: string;
  /** Whether the host is holding the room, which stops the answer being sent. */
  held: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  /** Reports that a sent answer is being changed, so the bar above can put the seat back at
   * work. */
  onEditing?: (editing: boolean) => void;
  /** Whether the round's enchanted card reaches this player, which fills the words in the answer
   * field with the glint. The room's own roll says who, so it is the same on every screen. */
  glinted?: boolean;
  /** What the round's enchantment does, named over the keys: the effect and the letters it bans.
   * Absent where the round's theme carries no enchantment, and the bar with it. */
  enchantment?: string;
  /** The multiplier the round's enchanted card wears, shown at the head of that bar. */
  mult?: number;
  /** The letters the round's enchanted card has banned, so the keys strike them through and take
   * nothing. Off the same roll as the note above them, since a bar naming banned letters over
   * keys that still type them is a bar that lies. */
  bannedLetters?: ReadonlySet<string>;
  /** The letters the round's enchantment insists the answer carry, marked on the keys and held
   * against the send. Off the same roll as the note over them. */
  requiredLetters?: ReadonlySet<string>;
  /** The bound of letters the enchantment holds the answer to, off the same roll as the note. */
  bound?: LetterBound;
}

/** Writing phase: the question, the answer field, and the keys that write it. What the room is
 * waiting for is not said in a line of its own: the answer itself turns yellow once it is sent,
 * which says it where the player is already looking. */
export function WritingScreen(props: WritingScreenProps) {
  const { durationMs, remainingMs, enchantment, ...shared } = props;
  const timeUp = remainingMs <= 0;
  const input = { ...shared, remainingMs, totalMs: durationMs, timeUp };
  // The bar says the requirement is not met yet, in every sense of it Р В Р’В Р вЂ™Р’В Р В Р’В Р Р†Р вЂљР’В Р В Р’В Р вЂ™Р’В Р В Р вЂ Р В РІР‚С™Р РЋРІвЂћСћР В Р’В Р В РІР‚В Р В Р’В Р Р†Р вЂљРЎв„ўР В Р Р‹Р РЋРЎв„ў including an empty draft,
  // since nothing written is no answer and the bar is the only place that can be said out loud.
  // The words go pink only when a draft is wrong, since an unfinished one is not a fault.
  const unmet = demandOf(shared.value, shared.requiredLetters, shared.bound);
  const faulted =
    unsent(unmet) || (unmet === 'None' && roundAsks(shared.requiredLetters, shared.bound));
  return (
    <Screen vertical="Bottom" width="Wide">
      <Card variant="Elevated">
        <EnchantmentBar
          note={enchantment}
          mult={props.mult}
          glinted={props.glinted === true && faulted}
        />
        <AnswerInput {...input} />
      </Card>
    </Screen>
  );
}
