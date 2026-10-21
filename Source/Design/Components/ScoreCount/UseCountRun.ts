import { useEffect, useRef, useState } from 'preact/hooks';
import { createLogger } from '@/Core';
import { playSound } from '../../Sounds';
import { frameAt, type CountSpec } from './CountAt';

const log = createLogger('ScoreCount');

/** The three things the effects of a count share, since the restart and the frame loop both
 * speak about the same run of the same line. */
interface CountRefs {
  frame: { current: number };
  runUp: { current: number };
  lastValue: { current: number };
}

/** What one card's line is counting, as the component is given it. */
export interface CountRunSpec {
  from: number;
  to: number;
  onBeat?: () => void;
  durationMs: number;
  paused: boolean;
  run: number;
  /** Whether the walk is heard. A count is heard by default, since one figure counting up is one
   * thing for the room to listen to; a caller that counts a roomful of figures at once turns it
   * off on all but one of them, so the sound is a count rather than a roomful of counts. */
  silent?: boolean;
}

/** What one frame of a count is given: the line it walks, and whether the walk is heard. */
interface FrameSpec extends CountSpec {
  silent?: boolean;
}

/** Beginning the count again from the start of its line: the figure goes back to the figure it
 * counts from, the frame standing from the last run is cancelled rather than left to carry on
 * underneath the new one, and the line takes its beat as it opens. */
function useCountRestart(
  spec: CountRunSpec,
  refs: CountRefs,
  setValue: (value: number) => void
): void {
  const { from, to, durationMs, run, onBeat } = spec;
  useEffect(() => {
    refs.lastValue.current = from;
    refs.runUp.current = 0;
    setValue(from);
    onBeat?.();
    if (refs.frame.current !== 0) {
      cancelAnimationFrame(refs.frame.current);
      refs.frame.current = 0;
    }
  }, [from, to, durationMs, run]);
}

/** One frame: the figure takes what the frame says, and a whole point arriving is the pop the
 * count moves with. The walk's own place is carried by the refs rather than recomputed, since
 * the loop is the only thing that knows how far it has got. */
function walkFrame(
  spec: FrameSpec,
  refs: CountRefs,
  begin: number,
  setValue: (value: number) => void,
  setStep: (step: (step: number) => number) => void,
  now: number
): void {
  refs.runUp.current = Math.min(spec.durationMs, now - begin);
  const shown = frameAt(refs.runUp.current, spec);
  if (shown !== refs.lastValue.current) {
    refs.lastValue.current = shown;
    setStep((step) => step + 1);
    if (spec.silent !== true) playSound('Pop');
  }
  setValue(shown);
  if (refs.runUp.current < spec.durationMs) {
    refs.frame.current = requestAnimationFrame((next) =>
      walkFrame(spec, refs, begin, setValue, setStep, next)
    );
  } else {
    setValue(spec.to);
    refs.frame.current = 0;
  }
}

/** The walk over one line of a count, held where it stands while the room is. A count held must
 * carry on from where it stopped rather than from the beginning, so the place it had got to is
 * a ref the next run picks up rather than state the hold would have reset. */
function useCountFrames(
  spec: CountRunSpec,
  refs: CountRefs,
  setValue: (value: number) => void,
  setStep: (step: (step: number) => number) => void
): void {
  const { from, to, durationMs, paused, run, silent } = spec;
  useEffect(() => {
    if (from === to || paused) {
      return;
    }
    const begin = performance.now() - refs.runUp.current;
    const tick = (now: number): void =>
      walkFrame({ from, to, durationMs, silent }, refs, begin, setValue, setStep, now);
    refs.frame.current = requestAnimationFrame(tick);
    return () => {
      if (refs.frame.current !== 0) {
        cancelAnimationFrame(refs.frame.current);
        refs.frame.current = 0;
      }
    };
  }, [from, to, durationMs, paused, run]);
}

/** What the count was asked for, said once when it is asked: a line per frame of a count would
 * be a log the room waited on rather than one it could read. */
function useCountLog(spec: CountRunSpec): void {
  const { from, to, run, paused, durationMs } = spec;
  useEffect(() => {
    log(
      'info',
      `${from}→${to} run=${run} paused=${paused}`,
      from === to ? 'no count, the figure is already there' : `counting over ${durationMs}ms`
    );
  }, [from, to, run, paused, durationMs]);
}

/** One line of a card being paid, as the component shows it: the figure, and a number to key the
 * pop on so the figure is a new element every arrival. */
export interface CountState {
  value: number;
  step: number;
}

/** Driving one count: the figure counting up to what the card is worth at this line. */
export function useCountRun(spec: CountRunSpec): CountState {
  const [value, setValue] = useState(spec.from);
  const [step, setStep] = useState(0);
  const frame = useRef(0);
  const lastValue = useRef(spec.from);
  const runUp = useRef(0);
  const refs: CountRefs = { frame, lastValue, runUp };
  useCountRestart(spec, refs, setValue);
  useCountFrames(spec, refs, setValue, setStep);
  useCountLog(spec);
  return { value, step };
}
