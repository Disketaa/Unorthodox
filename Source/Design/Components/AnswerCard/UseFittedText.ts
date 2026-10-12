import type { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { useViewportMeasure } from '@/Design/Primitives';

/** How much of the size a step takes off, and how many steps before it gives up. A dozen is a
 * little under a third of the size: an answer needing more is not being read at a glance. */
const FitStep = 0.92;
const FitSteps = 12;

/** The scale the writing on a card is held at, as a custom property rather than a size, so the
 * size stays a share of the card's width and only the reading of it is fitted. */
const FitProperty = '--AnswerCard-Fit';

/** Shrinks the writing on a card until the whole of it fits, rather than cutting the end off. A
 * font size that fits its box is not expressible in CSS, so a card holding a word wider than
 * itself has three answers: wrap it, cut it, or measure it. This is the third one. */
export function useFittedText(node: RefObject<HTMLElement | null>, text: string): void {
  useEffect(fit(node), [node, text]);
  // The box changes under the writing whenever the card is laid out, the window moves, or its
  // row is resized. An observer rather than a measurement on mount, because a card measured
  // before its font has loaded reports a size it never had and nothing afterwards would ask again.
  useBoxResize(node, fit(node));
  useViewportMeasure(node, fit(node));
}

/** The fitter for one element. A function rather than one body shared by three callers, because
 * the effect, the observer and the window measurement each hold it and each lets it go. */
function fit(node: RefObject<HTMLElement | null>): () => void {
  return () => {
    const element = node.current;
    // A box with no layout cannot be fitted to. Reporting that and stopping is what the observer
    // is for: it will call back once there is a box to measure.
    if (element === null || element.clientHeight === 0) {
      return;
    }
    element.style.setProperty(FitProperty, '1');
    for (let step = 0; step < FitSteps; step += 1) {
      if (element.scrollHeight <= element.clientHeight + 1) {
        return;
      }
      element.style.setProperty(FitProperty, String(FitStep ** (step + 1)));
    }
  };
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
