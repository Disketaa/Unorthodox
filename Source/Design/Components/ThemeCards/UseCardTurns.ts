import { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
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
  useEffect(() => {
    const rowNode = row.current;
    if (rowNode === null) {
      return;
    }

    const apply = () => {
      const maxYaw = angleOf(rowNode, '--Angle-ThemeCardYaw');
      const maxPitch = angleOf(rowNode, '--Angle-ThemeCardPitch');
      const viewport = rowNode.ownerDocument.defaultView;
      if (viewport === null) {
        return;
      }
      const middleX = viewport.innerWidth / 2;
      const middleY = viewport.innerHeight / 2;
      cards.forEach((card) => {
        const node = card.current;
        if (node === null) {
          return;
        }
        const box = node.getBoundingClientRect();
        const centreX = box.left + box.width / 2;
        const centreY = box.top + box.height / 2;
        node.style.setProperty(
          '--ThemeCard-Yaw',
          `${turnFor(centreX - middleX, viewport.innerWidth / 2, maxYaw)}deg`,
        );
        node.style.setProperty(
          '--ThemeCard-Pitch',
          `${turnFor(centreY - middleY, viewport.innerHeight / 2, maxPitch)}deg`,
        );
      });
    };

    apply();
    viewportOf(rowNode)?.addEventListener('resize', apply);
    return () => viewportOf(rowNode)?.removeEventListener('resize', apply);
  }, [row, cards]);
}

/** The angle a token holds, in degrees, or nothing turned when it cannot be read. */
function angleOf(node: HTMLElement, token: string): number {
  const value = getComputedStyle(node).getPropertyValue(token).trim();
  const degrees = Number.parseFloat(value);
  return Number.isFinite(degrees) ? degrees : 0;
}

function viewportOf(node: HTMLElement): Window | null {
  return node.ownerDocument.defaultView;
}
