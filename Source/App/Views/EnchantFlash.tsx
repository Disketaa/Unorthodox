import { GlintFlash } from '@/Design/Components';
import { useEnchantFlash } from '../Hooks/UseEnchantFlash';
import type { GameSessionView } from '../Hooks/UseGameSession';

/** The room flashed with the shine of the round's enchantment, when the card being counted was
 * one the enchantment reached. Over the window rather than over the board or the bar of
 * players, since what is being said is that the whole room has been touched. */
export function EnchantFlash({ view }: { view: GameSessionView }) {
  const card = useEnchantFlash(view);
  if (card === undefined) return null;
  return <GlintFlash key={card} full sound />;
}
