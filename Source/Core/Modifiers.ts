/** What a theme card can carry on top of the theme it already wears. Shared vocabulary, since a
 * card is drawn in Design, a round's modifiers are rolled in Game and the room sees the result
 * on every screen at once: one union is what all three have to agree on. */
export type ThemeModifierId = 'Enchanted' | 'Alone' | 'Half' | 'Laggards' | 'Leaders';

/** The four spreads an enchanted card's multiplier can take, without the enchantment itself. A
 * card is enchanted and then carries one of these; the enchantment is what draws the glint and
 * the effect is who the multiplier reaches. */
export type ThemeEffectId = 'Alone' | 'Half' | 'Laggards' | 'Leaders';

/** The effect a card's modifiers carry, or undefined where it carries none. */
export function effectOf(
  carried: readonly ThemeModifierId[] | undefined
): ThemeEffectId | undefined {
  return carried?.find((id): id is ThemeEffectId => id !== 'Enchanted');
}
