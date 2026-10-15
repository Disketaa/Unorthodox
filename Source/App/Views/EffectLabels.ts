import { ThemeEffectId, lettersOf } from '@/Core';
import { Strings } from '@/Content';
import { enchantmentFor } from '@/Game';
import type { PublicRoom } from '@/Game';

/** What one effect is called, in the player's language. One mapping rather than one per screen,
 * since the bank of cards and the bar over the keys both name the same four effects and two
 * spellings of them would drift apart. */
export function effectLabelOf(effect: ThemeEffectId | undefined): string | undefined {
  if (effect === undefined) return undefined;
  if (effect === 'Alone') return Strings.effects.alone;
  if (effect === 'Half') return Strings.effects.half;
  if (effect === 'Laggards') return Strings.effects.laggards;
  return Strings.effects.leaders;
}

/** The letters a round bans as one line of text, showing each letter once since both layouts
 * share the same shape. */
export function lettersLine(banned: readonly { ru: string; en: string }[]): string {
  return banned.map((pair) => pair.ru).join(', ');
}

/** What the round's enchantment does, off the room's own roll: the note naming the effect and
 * the letters it bans, and the letters as the set the keys check against. Read in one place,
 * since the question stage and the writing phase name the same enchantment. */
export function enchantmentOf(
  roomCode: string,
  theme: string | undefined,
  spent: PublicRoom['spent'] | undefined
): { note: string | undefined; banned: ReadonlySet<string> } {
  const { effect, banned } = enchantmentFor(roomCode, theme, spent ?? []);
  const label = effectLabelOf(effect);
  return {
    note: label === undefined ? undefined : Strings.writing.enchantment(lettersLine(banned)),
    banned: lettersOf(banned),
  };
}
