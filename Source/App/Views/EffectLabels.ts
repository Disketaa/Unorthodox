import { ThemeEffectId, ThemeEnchantId, lettersOf, type LetterBound, type ThemeRef } from '@/Core';
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

/** Which end of a length an enchantment holds an answer to, or absent where the round asks about
 * letters rather than length. */
export type LengthBound = LetterBound;

/** What an enchantment asks of a screen: the letters it takes away, the ones it insists on, and
 * the length it holds the answer to. Exactly one of the three is ever asked for, since a round
 * carries one enchantment and not a list of them. */
export interface EnchantmentAsk {
  banned: ReadonlySet<string>;
  required: ReadonlySet<string>;
  bound: LengthBound;
}

/** The round's enchantment as a screen reads it: what to name it, and what it asks of the
 * answer. */
export interface Enchantment extends EnchantmentAsk {
  note: string | undefined;
  /** The multiplier the card wears, worn at the head of the bar in the same hand as the card. */
  mult: number | undefined;
}

/** What the round's enchantment is, off the room's own roll: the note naming it and the three
 * things it could ask for, of which it asks exactly one. Read in one place, since the question
 * stage and the writing phase name the same enchantment. */
export function enchantmentOf(
  roomCode: string,
  theme: ThemeRef | undefined,
  spent: PublicRoom['spent'] | undefined
): Enchantment {
  const roll = enchantmentFor(roomCode, theme, spent ?? []);
  const label = effectLabelOf(roll.effect);
  if (label === undefined) return { note: undefined, ...NoEnchantment, mult: undefined };
  if (
    roll.bound !== undefined &&
    (roll.enchant === 'MinLength' || roll.enchant === 'MaxLength')
  ) {
    return {
      note: lengthNote(roll.enchant, roll.bound),
      ...NoEnchantment,
      mult: roll.mult,
      ...lengthBound(roll.enchant, roll.bound),
    };
  }
  const line = lettersLine(roll.letters);
  const letters = lettersOf(roll.letters);
  if (roll.enchant === 'Demand') {
    return {
      note: Strings.writing.demand(line),
      ...NoEnchantment,
      required: letters,
      mult: roll.mult,
    };
  }
  return {
    note: Strings.writing.enchantment(line),
    ...NoEnchantment,
    banned: letters,
    mult: roll.mult,
  };
}

/** The two length enchants in one place, since they differ only in which end they hold. */
function lengthNote(enchant: ThemeEnchantId, figure: number): string {
  return enchant === 'MinLength'
    ? Strings.writing.minLength(figure)
    : Strings.writing.maxLength(figure);
}

function lengthBound(enchant: ThemeEnchantId, figure: number) {
  return { bound: { figure, least: enchant === 'MinLength' } };
}

const NoEnchantment: EnchantmentAsk = {
  banned: new Set<string>(),
  required: new Set<string>(),
  bound: undefined,
};
