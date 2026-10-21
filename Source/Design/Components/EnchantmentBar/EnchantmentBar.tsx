import { Banner } from '../Banner';

export interface EnchantmentBarProps {
  /** What the round's enchantment does, or undefined where the round carries none — in which
   * case the bar is not drawn at all rather than drawn empty. */
  note: string | undefined;
  /** The multiplier the round's enchanted card wears, worn at the head where a mark would be, so
   * the bar says how hard the enchantment was rolled as well as what it does. */
  mult: number | undefined;
  /** Whether the bar wears the glint and the error ink, which is for a draft the room will not
   * take yet — not for the round as a whole, since the round does not go wrong, answers do. */
  glinted: boolean;
}

/** The bar naming what the round's enchantment does, over the keys it takes letters away from.
 * One bar for both places the room meets the enchantment, so two cannot spell one roll two
 * ways. */
export function EnchantmentBar({ note, mult, glinted }: EnchantmentBarProps) {
  if (note === undefined) return null;
  return (
    <Banner
      variant="Muted"
      glinted={glinted}
      badge={mult === undefined ? undefined : `x${mult}`}
      bold
    >
      {note}
    </Banner>
  );
}
