import type { RefObject } from 'preact';
import { useCallback, useEffect } from 'preact/hooks';
import { useViewportMeasure } from '@/Design/Primitives';

/** How much of the writing a card may give up before it is drawn too small to read at all. A
 * floor on the size rather than on the search, since the search measures what is left over. */
const MinScale = 0.2;

/** How many times the writing may be measured and shrunk before it is accepted as is. Every pass
 * is a forced layout, so the count is kept low, and it is a bound rather than a way out: a card
 * that cannot hold its answer within them was asked to hold something it was never going to. */
const Passes = 6;

/** How many lines of itself an answer may take up before the writing is made smaller. The cards
 * are taller than they are wide and most of that height goes unused, so a long answer is two
 * lines of full-size writing long before it is small writing on one line. */
const MaxLines = 2;

/** The scale the writing on a card is held at, as a custom property rather than a size, so the
 * size stays a share of the card's width and only the reading of it is fitted. */
const FitProperty = '--AnswerCard-Fit';

/** Shrinks the writing until the answer fits, rather than cutting the end off: a font size that
 * fits its box is not expressible in CSS. `property` is where the result lands, and is passed
 * in because the two things that need fitting sit against different boxes. */
export function useFittedText(
  node: RefObject<HTMLElement | null>,
  text: string,
  property: string = FitProperty,
  minScale: number = MinScale
): void {
  const measure = useCallback(fit(node, property, minScale), [node, property, minScale]);
  useEffect(measure, [measure, text]);
  // The box changes under the writing whenever the card is laid out, the window moves, or its
  // row is resized. An observer rather than a measurement on mount, because a card measured
  // before its font has loaded reports a size it never had and nothing afterwards would ask again.
  useBoxResize(node, measure);
  useViewportMeasure(node, measure);
}

/** The fitter for one element. A function rather than one body shared by three callers, because
 * the effect, the observer and the window measurement each hold it and each lets it go. */
function fit(
  node: RefObject<HTMLElement | null>,
  property: string,
  minScale: number
): () => void {
  return () => {
    const element = node.current;
    // A box with no layout cannot be fitted to. Reporting that and stopping is what the observer
    // is for: it will call back once there is a box to measure.
    if (element === null || roomOf(element).clientHeight === 0) {
      return;
    }
    element.style.setProperty(property, '1');
    scaleTo(element, property, minScale);
  };
}

/** How much of its full size the writing is drawn at. Each pass multiplies the size by what is
 * measured to be left over, rather than dividing by a ratio taken once at the larger size. */
function scaleTo(element: HTMLElement, property: string, minScale: number): void {
  let scale = 1;
  for (let pass = 0; pass < Passes; pass += 1) {
    element.style.setProperty(property, String(scale));
    if (fits(element)) {
      return;
    }
    scale = Math.max(minScale, scale * shortfall(element));
  }
  element.style.setProperty(property, String(scale));
}

/** How much smaller the writing must be drawn to fit, as a share of what it measures right now,
 * rather than a share of full size: the line count moves in whole lines, so asking against full
 * size answers the same question at every size. The width is asked the same way. */
function shortfall(element: HTMLElement): number {
  const height = textHeight(element);
  const lines = linesIn(element);
  const byHeight = height > 0 ? roomOf(element).clientHeight / height : 1;
  const byLines = lines > 0 ? MaxLines / lines : 1;
  const width = textWidth(element);
  const byWidth = width > 0 ? element.clientWidth / width : 1;
  return Math.min(1, byHeight, byLines, byWidth);
}

/** Whether the answer is within the card: as tall as the room gives it, no longer than the lines
 * it is allowed, and no wider than the card. The width is what keeps a word whole — a word that
 * does not fit is shrunk until it does rather than sawn in half by the line breaker. */
function fits(element: HTMLElement): boolean {
  return (
    textHeight(element) <= roomOf(element).clientHeight + 1 &&
    linesIn(element) <= MaxLines &&
    textWidth(element) <= element.clientWidth + 1
  );
}

/** The card's inner room, which is the space the answer has to be written into. Its parent by
 * construction: the answer is the only thing in the room, and the room fills the card. */
function roomOf(element: HTMLElement): HTMLElement {
  return element.parentElement ?? element;
}

/** How tall the writing itself is, rather than how tall the box around it is. The answer is
 * centred in its box, and a centred line that overflows spills above the box's own top edge,
 * which reading `scrollHeight` never reports. */
function textHeight(element: HTMLElement): number {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const height = range.getBoundingClientRect().height;
  range.detach();
  return height;
}

/** How wide the writing itself is rather than the box around it. A centred line that outgrows
 * its box spills both ways while `scrollWidth` counts only the far side, so double it back
 * using layout widths rather than painted ones: a transform must not change the fit. */
function textWidth(element: HTMLElement): number {
  const overflow = element.scrollWidth - element.clientWidth;
  return overflow > 0 ? element.scrollWidth + overflow : element.clientWidth;
}

/** How many lines of itself the answer is at the size it is currently drawn, against its own
 * line height rather than a count of boxes: the line height is what the writing occupies, and
 * it moves with the size being fitted. */
function linesIn(element: HTMLElement): number {
  const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
  const height = textHeight(element);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    return height;
  }
  return height / lineHeight;
}

/** Call back whenever the element's own box changes size, which is the writing being re-fitted
 * to a room that has moved under it. Silent where the browser has no observer, since a card
 * that is never resized still has to be fitted once. */
function useBoxResize(node: RefObject<HTMLElement | null>, measure: () => void): void {
  useEffect(() => {
    const element = node.current;
    const view = element?.ownerDocument.defaultView ?? undefined;
    if (element === null || view === undefined || typeof view.ResizeObserver !== 'function') {
      return;
    }
    const observer = new view.ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [node, measure]);
}
