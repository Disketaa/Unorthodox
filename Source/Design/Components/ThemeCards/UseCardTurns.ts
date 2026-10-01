import { RefObject } from 'preact';
import { useCallback } from 'preact/hooks';
import { useViewportMeasure } from '@/Design/Primitives';
import { turnFor } from './CardTurn';

/** The row and the cards it holds, as the refs the hook writes the turn onto. */
export type CardRefs = readonly RefObject<HTMLDivElement | null>[];

/**
 * The turn on each card, kept in step with where the cards are.
 *
 * Measured rather than written per position, because the row's width follows the window:
 * a card's distance from the middle of the screen is a different number on a phone and on
 * a desktop, and a fixed angle per position is right at exactly one of them. The two
 * angles are written onto each card's own node as custom properties, the way
 * `PaperBackground` writes its texture offset — the component's API stays closed, and a
 * caller cannot restyle a card by passing it something.
 *
 * The maximum angles are read from the row's own computed style rather than imported, so
 * the tokens remain the single place an angle is written and this file cannot drift from
 * them.
 *
 * Nothing is written when the window has no size to measure against, which is what a
 * server-rendered or a not-yet-laid-out page looks like: an unturned row is a plain row,
 * where dividing by a zero width would be a card pointing at the ceiling.
 */
export function useCardTurns(row: RefObject<HTMLDivElement | null>, cards: CardRefs): void {
  const apply = useCallback(() => {
    const rowNode = row.current;
    if (rowNode === null) {
      return;
    }
    const viewport = rowNode.ownerDocument.defaultView;
    if (viewport === null) {
      return;
    }
    const maxYaw = angleOf(rowNode, '--Angle-ThemeCardYaw');
    const maxPitch = angleOf(rowNode, '--Angle-ThemeCardPitch');
    const middleX = viewport.innerWidth / 2;
    const middleY = viewport.innerHeight / 2;
    cards.forEach((card) => {
      const node = card.current;
      if (node === null) {
        return;
      }
      const box = node.getBoundingClientRect();
      node.style.setProperty(
        '--ThemeCard-Yaw',
        `${turnFor(box.left + box.width / 2 - middleX, middleX, maxYaw)}deg`,
      );
      node.style.setProperty(
        '--ThemeCard-Pitch',
        `${turnFor(box.top + box.height / 2 - middleY, middleY, maxPitch)}deg`,
      );
    });
  }, [row, cards]);

  useViewportMeasure(row, apply);
}

/** The angle a token holds, in degrees, or nothing turned when it cannot be read. */
function angleOf(node: HTMLElement, token: string): number {
  const degrees = Number.parseFloat(getComputedStyle(node).getPropertyValue(token));
  return Number.isFinite(degrees) ? degrees : 0;
}
