import { useCallback } from 'preact/hooks';

/** The card's own pop, played on the beat the count hands over from its figure to the mark of
 * what it is adding and back. Played imperatively rather than by re-keying the `Pop` wrapping
 * the card: a key that moved here would rebuild the card, restarting the count that asked. */
export function useCardPop(motion: { current: HTMLDivElement | null }): () => void {
  return useCallback(() => {
    const node = motion.current;
    if (node === null) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Played on the card's individual properties, as the pop primitive plays them, so it
    // composes with the sway underneath instead of replacing it.
    const token = getComputedStyle(document.documentElement).getPropertyValue('--Duration-Pop');
    const ms = Number.parseFloat(token);
    node.animate([{ scale: '1 1.06' }, { scale: '1 1' }], {
      duration: Number.isNaN(ms) ? 300 : ms,
      easing: 'steps(7, jump-none)',
      fill: 'backwards',
    });
  }, [motion]);
}
