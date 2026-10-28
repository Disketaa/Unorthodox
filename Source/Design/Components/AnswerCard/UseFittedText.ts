import type { RefObject } from 'preact';
import { useCallback, useEffect } from 'preact/hooks';

/** How much of the writing a card may give up before it is drawn too small to read at all. A
 * floor on the size rather than on the search, since the search measures what is left over. */
const MinScale = 0.2;

/** How many sizes the writing may be measured at before the fit is accepted. Every pass is a
 * forced layout, so the count is kept low, and it is a bound rather than a way out: a card that
 * cannot hold its answer within them was asked to hold something it was never going to. */
const Passes = 6;

/** How long a resized room rests before writing is refit. Dragging sizes the room every frame,
 * and fitting every frame is a measurement per card per pass, so the old fit stands until it
 * settles. Longer than the name's easing, so an expanding card finishes before measuring. */
const ResizeSettleMs = 200;

/** How many lines of itself an answer may take up before the writing is made smaller. The cards
 * are taller than they are wide and most of that height goes unused, so a long answer is two
 * lines of full-size writing long before it is small writing on one line. */
const MaxLines = 2;

/** The scale the writing on a card is held at, as a custom property rather than a size, so the
 * size stays a share of the card's width and only the reading of it is fitted. */
const FitProperty = '--AnswerCard-Fit';

/** Fits the writing into its room, rather than cutting the end off: a font size that fits its
 * box is not expressible in CSS. `property` is where the result lands, and is passed in because
 * the things that need fitting sit against different boxes. */
export function useFittedText(
  node: RefObject<HTMLElement | null>,
  text: string,
  property: string = FitProperty,
  minScale: number = MinScale
): void {
  const measure = useCallback(fit(node, property, minScale), [node, property, minScale]);
  useEffect(measure, [measure, text]);
  // The room changes under the writing whenever the card is laid out or its row is resized, and
  // the room's own observer catches both without asking every card to listen to the window.
  useBoxResize(node, measure);
  // A face that has not arrived yet is measured in its fallback and then never asked again: the
  // room itself need not change when only the writing inside it does.
  useFontsReady(node, measure);
}

/** The fitter for one element. A function rather than one body shared by every caller, because
 * the effect, the observer and the face-loading measurement each hold it and each lets it go. */
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
    // Turn the transition off while measuring, then restore it: a transition would make each
    // pass measure the size being left rather than the one just set.
    const easing = element.style.transition;
    element.style.transition = 'none';
    scaleTo(element, property, minScale);
    void element.offsetWidth;
    element.style.transition = easing;
  };
}

/** The largest size that fits rather than the first size a shrinking estimate lands on: sizes
 * are searched so the writing stays as large as its card can hold. */
function scaleTo(element: HTMLElement, property: string, minScale: number): void {
  element.style.setProperty(property, '1');
  if (fits(element)) {
    return;
  }
  let smallest = minScale;
  let largest = 1;
  for (let pass = 0; pass < Passes; pass += 1) {
    const scale = (smallest + largest) / 2;
    element.style.setProperty(property, String(scale));
    if (fits(element)) {
      smallest = scale;
    } else {
      largest = scale;
    }
  }
  element.style.setProperty(property, String(smallest));
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

/** Refits the writing after the room it sits in changes size. The room, not the writing itself,
 * is observed: the fitter changes the writing's box and would answer its own measurement. */
function useBoxResize(node: RefObject<HTMLElement | null>, measure: () => void): void {
  useEffect(() => {
    const element = node.current;
    const view = element?.ownerDocument.defaultView ?? undefined;
    if (element === null || view === undefined || typeof view.ResizeObserver !== 'function') {
      return;
    }
    let settle: number | undefined;
    const observer = new view.ResizeObserver(() => {
      if (settle !== undefined) {
        view.clearTimeout(settle);
      }
      settle = view.setTimeout(measure, ResizeSettleMs);
    });
    observer.observe(roomOf(element));
    return () => {
      observer.disconnect();
      if (settle !== undefined) {
        view.clearTimeout(settle);
      }
    };
  }, [node, measure]);
}

/** Refits once the page's faces arrive: a fallback face can fit a room the real face never
 * needed. */
function useFontsReady(node: RefObject<HTMLElement | null>, measure: () => void): void {
  useEffect(() => {
    const fonts = node.current?.ownerDocument.fonts;
    if (fonts === undefined) {
      return;
    }
    let live = true;
    const again = () => {
      if (live) {
        measure();
      }
    };
    void fonts.ready.then(again);
    fonts.addEventListener('loadingdone', again);
    return () => {
      live = false;
      fonts.removeEventListener('loadingdone', again);
    };
  }, [node, measure]);
}
