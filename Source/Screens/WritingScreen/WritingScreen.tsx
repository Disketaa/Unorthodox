import { Screen } from '@/Design/Primitives';
import { Banner, Card } from '@/Design/Components';
import { AnswerInput } from './AnswerInput';

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
  /** The letters the round's enchanted card has banned, so the keys strike them through and take
   * nothing. Off the same roll as the note above them, since a bar naming banned letters over
   * keys that still type them is a bar that lies. */
  bannedLetters?: ReadonlySet<string>;
  /** The letters the round's enchantment insists the answer carry, marked on the keys and held
   * against the send. Off the same roll as the note over them. */
  requiredLetters?: ReadonlySet<string>;
}

/** Writing phase: the question, the answer field, and the keys that write it. What the room is
 * waiting for is not said in a line of its own — the answer itself turns yellow once it is
 * sent, which says it where the player is already looking. */
export function WritingScreen(props: WritingScreenProps) {
  // Taken apart rather than destructured: the input is the same thing under two other names, and
  // spelling the pairs out twice is how a prop gets added to one and forgotten on the other.
  const { durationMs, remainingMs, enchantment, glinted, ...shared } = props;
  const timeUp = remainingMs <= 0;
  const input = { ...shared, remainingMs, totalMs: durationMs, timeUp };
  return (
    <Screen vertical="Bottom" width="Wide">
      <Card variant="Elevated">
        <EnchantmentBar note={enchantment} glinted={glinted} />
        <AnswerInput {...input} />
      </Card>
    </Screen>
  );
}

/** The bar naming what the round's enchantment does, over the keys it takes letters away from.
 * Absent where the round carries none, rather than drawn empty. */
function EnchantmentBar({ note, glinted }: { note: string | undefined; glinted?: boolean }) {
  if (note === undefined) return null;
  return (
    <Banner variant="Muted" glinted={glinted}>
      {note}
    </Banner>
  );
}
