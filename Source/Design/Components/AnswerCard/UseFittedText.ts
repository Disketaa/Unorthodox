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
  // Coalesced to one fit per frame: writing arriving a letter at a time would otherwise force a
  // full binary search on every letter, at a rate the display can never show.
  useEffect(() => {
    if (typeof requestAnimationFrame !== 'function') {
      measure();
      return;
    }
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [measure, text]);
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

/** The largest size that fits, measured rather than guessed: a single line's own overflow says
 * exactly how far to shrink it, and only wrapping needs a search. */
function scaleTo(element: HTMLElement, property: string, minScale: number): void {
  const maxHeight = roomOf(element).clientHeight + 1;
  const maxWidth = element.clientWidth + 1;
  element.style.setProperty(property, '1');
  const whole = measureText(element);
  if (within(whole, maxHeight, maxWidth)) {
    return;
  }
  let smallest = minScale;
  let largest = 1;
  // Glyph advances grow with the size, so a line's own overflow is exactly how far to shrink it:
  // one measurement in place of a search from the middle. Wrapping breaks that ratio, so a room
  // it still does not fit falls back to the search, which never assumes the estimate was right.
  const estimate = whole.lines === 1 && whole.width > 0 ? Math.min(1, maxWidth / whole.width) : 1;
  if (estimate > minScale) {
    element.style.setProperty(property, String(estimate));
    if (within(measureText(element), maxHeight, maxWidth)) {
      return;
    }
    largest = estimate;
  }
  for (let pass = 0; pass < Passes; pass += 1) {
    const scale = (smallest + largest) / 2;
    element.style.setProperty(property, String(scale));
    if (within(measureText(element), maxHeight, maxWidth)) {
      smallest = scale;
    } else {
      largest = scale;
    }
  }
  element.style.setProperty(property, String(smallest));
}

/** Whether the writing is within the card: as tall as the room gives it, no longer than the
 * lines it is allowed, and no wider than the card. The width is what keeps a word whole — a
 * word that does not fit is shrunk until it does rather than sawn in half by the line breaker. */
function within(text: TextMeasure, maxHeight: number, maxWidth: number): boolean {
  return text.height <= maxHeight && text.lines <= MaxLines && text.width <= maxWidth;
}

/** What the writing measures at the size it is drawn, read in one go: each read is a layout. */
interface TextMeasure {
  height: number;
  lines: number;
  width: number;
}

/** The card's inner room, which is the space the answer has to be written into. Its parent by
 * construction: the answer is the only thing in the room, and the room fills the card. */
function roomOf(element: HTMLElement): HTMLElement {
  return element.parentElement ?? element;
}

/** What the writing measures at the size it is drawn, read in one go: each read is a layout. The
 * width is the writing's own rather than the box around it, so a centred line that outgrows the
 * box — `scrollWidth` counts only the far side — is doubled back before it is compared. */
function measureText(element: HTMLElement): TextMeasure {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const height = range.getBoundingClientRect().height;
  const lines = range.getClientRects().length;
  range.detach();
  const overflow = element.scrollWidth - element.clientWidth;
  const width = overflow > 0 ? element.scrollWidth + overflow : element.clientWidth;
  return { height, lines, width };
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
    let live = true;
    let settle: number | undefined;
    const observer = new view.ResizeObserver(() => {
      if (!live) return;
      if (settle !== undefined) {
        view.clearTimeout(settle);
      }
      settle = view.setTimeout(measure, ResizeSettleMs);
    });
    observer.observe(roomOf(element));
    return () => {
      live = false;
      observer.disconnect();
      if (settle !== undefined) {
        view.clearTimeout(settle);
      }
    };
  }, [node, measure]);
}

/** The promise the page's faces resolve, kept per document: the getter builds a new one on every
 * read, and every fitted box on the page reads it at least once. */
const facePromises = new WeakMap<Document, Promise<FontFaceSet>>();

function facesReady(document: Document): Promise<FontFaceSet> {
  const kept = facePromises.get(document);
  if (kept !== undefined) {
    return kept;
  }
  const ready = document.fonts.ready;
  facePromises.set(document, ready);
  return ready;
}

/** Refits once the page's faces arrive: a fallback face can fit a room the real face never
 * needed. A page whose faces are already in has nothing to wait for. */
function useFontsReady(node: RefObject<HTMLElement | null>, measure: () => void): void {
  useEffect(() => {
    const document = node.current?.ownerDocument;
    const fonts = document?.fonts;
    if (document === undefined || fonts === undefined || fonts.status === 'loaded') {
      return;
    }
    let live = true;
    const again = () => {
      if (live) {
        measure();
      }
    };
    void facesReady(document).then(again);
    fonts.addEventListener('loadingdone', again);
    return () => {
      live = false;
      fonts.removeEventListener('loadingdone', again);
    };
  }, [node, measure]);
}
