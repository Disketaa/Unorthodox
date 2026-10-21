import { useEffect, useRef, useState } from 'preact/hooks';
import { playSound } from '../../Sounds';
import type { PlayerBarEntry } from './PlayerBar';

/** How long the counter takes to climb from the old standing to the new one. */
const CountUpMs = 400;

/** The figure the seat stands for while the count runs: the addition gives way to the total, Pop
 * lands the figure, and the counter climbs from what the seat was at to what it now is. Returns
 * the figure being climbed through, or nothing while the seat is not climbing. */
export function useCountUp(
  payout: PlayerBarEntry['payout'],
  payoutValue: number
): number | undefined {
  // The last payout the seat saw, so the change from this card's addition to the player's total is
  // caught the moment it lands and the climb starts from where the seat stood. Pop on that second
  // move is the card's own, sounded above — a card worth nothing leaves the seat nothing to pop.
  const previousPayout = useRef<{ value: number; added: boolean } | undefined>(undefined);
  // The last total the seat stood at, so the counter can climb from it rather than from nowhere.
  const previousTotal = useRef<number>(0);
  // Where the current climb started, captured before previousTotal is overwritten.
  const countStart = useRef<number>(0);
  // Trigger that flips once when the addition gives way to the total, so the animation effect
  // starts exactly once per card rather than once per frame.
  const [countingTrigger, setCountingTrigger] = useState(0);
  // The figure the counter is climbing through right now, if any. While it climbs, the seat
  // shows the running figure instead of the landed one — 50, 51, 52 — until it reaches the total.
  const [counting, setCounting] = useState<number | undefined>(undefined);

  // The addition gives way to the total: Pop says the figure has landed and the seat is done. The
  // counter climbs from what the seat was at to what it is now, figure by figure, so the room
  // watches the standing grow rather than jump. Played once, at the start of the climb.
  useEffect(() => {
    const before = previousPayout.current;
    previousPayout.current = payout;
    // The addition has to have added something. A card that paid nothing — one the room turned
    // down, or one two people wrote — leaves the seat where it was, and a note saying it was
    // paid is the game announcing a figure it is not paying.
    if (
      before?.added === true &&
      before.value !== 0 &&
      payout?.added === false &&
      before.value !== payout.value
    ) {
      countStart.current = payout.from ?? previousTotal.current;
      setCounting(countStart.current);
      playSound('Pop');
      previousTotal.current = payout.value;
      setCountingTrigger((tick) => tick + 1);
    }
  }, [payout?.added, payout?.value]);

  // Climb the counter one figure at a time until it reaches the total: each frame its own figure,
  // so the room sees 50, 51, 52 rather than one jump. countingTrigger flips once per card, so
  // this effect runs exactly once per climb rather than on every frame.
  useEffect(() => {
    if (counting === undefined || counting >= payoutValue) return;
    return animateCount(countStart.current, payoutValue, setCounting);
  }, [countingTrigger, payoutValue]);

  return counting;
}

/** One climb: a figure per frame from where the seat stood to where it now stands, cancelled if
 * the seat is paid again before reaching the total. */
function animateCount(
  from: number,
  to: number,
  setFigure: (value: number) => void
): () => void {
  let cancelled = false;
  const startTime = performance.now();
  const frame = () => {
    if (cancelled) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / CountUpMs, 1);
    const current = Math.round(from + (to - from) * progress);
    setFigure(current);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      setFigure(to);
    }
  };
  requestAnimationFrame(frame);
  return () => {
    cancelled = true;
  };
}
