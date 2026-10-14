/** What a theme card can carry on top of the theme it already wears. Shared vocabulary, since a
 * card is drawn in Design, a round's modifiers are rolled in Game and the room sees the result
 * on every screen at once: one union is what all three have to agree on. */
export type ThemeModifierId = 'Enchanted' | 'Alone' | 'Half' | 'Laggards' | 'Leaders';
