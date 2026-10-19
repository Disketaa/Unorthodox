import { useEffect, useRef, useState } from 'preact/hooks';
import { createLogger } from '@/Core';
import { playSound } from '../../Sounds';
import { frameAt, type CountPhase, type CountSpec } from './CountAt';

const log = createLogger('ScoreCount');

/** The four things the effects of a count share, since the restart and the frame loop both speak
 * about the same run of the same line. */
interface CountRefs {
  frame: { current: number };
  runUp: { current: number };
  lastValue: { current: number };
  lastPhase: { current: CountPhase };
}

/** What one card's line is counting, as the component is given it. */
export interface CountRunSpec {
  from: number;
  to: number;
  added?: number;
  addedMark?: 'Mult' | 'Likes';
  onBeat?: () => void;
  durationMs: number;
  paused: boolean;
  run: number;
}

/** A handover: a different thing is standing in the figure's place, so the card is popped and
 * the beat handed over once. One note, and only on the mark arriving — the count starting is
 * the mark leaving, and the count already clicks on every point it passes. */
function useHandover(
  refs: CountRefs,
  setPhase: (phase: CountPhase) => void,
  onBeat: (() => void) | undefined
): (phase: CountPhase) => void {
  return (phase: CountPhase) => {
    if (refs.lastPhase.current === phase) return;
    refs.lastPhase.current = phase;
    setPhase(phase);
    onBeat?.();
    if (phase === 'mark') playSound('Pling');
  };
}

/** Beginning the count again from the start of its phase: the figures go back to the figure they
 * count from, and the frame standing from the last run is cancelled rather than left to carry
 * on underneath the new one. */
function useCountRestart(
  spec: CountRunSpec,
  refs: CountRefs,
  marked: boolean,
  setValue: (value: number) => void,
  setPhase: (phase: CountPhase) => void
): void {
  const { from, to, durationMs, run } = spec;
  useEffect(() => {
    refs.lastValue.current = from;
    refs.runUp.current = 0;
    // `marked` is read once here on purpose: re-opening the count every time the mark's own
    // value arrived would restart the count on each point of the addition it is counting.
    refs.lastPhase.current = marked ? 'from' : 'count';
    setPhase(refs.lastPhase.current);
    setValue(from);
    if (refs.frame.current !== 0) {
      cancelAnimationFrame(refs.frame.current);
      refs.frame.current = 0;
    }
  }, [from, to, durationMs, run]);
}

/** One frame: the line's own phase is handed over, the figure takes what the frame says, and a
 * whole point arriving is the pop the count moves with. The walk's own place is carried by the
 * refs rather than recomputed, since the loop is the only thing that knows how far it has got. */
function walkFrame(
  spec: CountSpec,
  refs: CountRefs,
  begin: number,
  handover: (phase: CountPhase) => void,
  setValue: (value: number) => void,
  setStep: (step: (step: number) => number) => void,
  now: number
): void {
  refs.runUp.current = Math.min(spec.durationMs, now - begin);
  const shown = frameAt(refs.runUp.current, spec);
  handover(shown.phase);
  if (shown.phase === 'count' && shown.value !== refs.lastValue.current) {
    refs.lastValue.current = shown.value;
    setStep((step) => step + 1);
    playSound('Pop');
  }
  setValue(shown.value);
  if (refs.runUp.current < spec.durationMs) {
    refs.frame.current = requestAnimationFrame((next) =>
      walkFrame(spec, refs, begin, handover, setValue, setStep, next)
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
  marked: boolean,
  handover: (phase: CountPhase) => void,
  setValue: (value: number) => void,
  setStep: (step: (step: number) => number) => void
): void {
  const { from, to, durationMs, paused, run } = spec;
  useEffect(() => {
    if (from === to || paused) {
      return;
    }
    const begin = performance.now() - refs.runUp.current;
    const tick = (now: number): void =>
      walkFrame(
        { from, to, marked, durationMs },
        refs,
        begin,
        handover,
        setValue,
        setStep,
        now
      );
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

/** One line of a card being paid, as the component shows it: the figure, which of the three is
 * standing, and a number to key the pop on so the figure is a new element every arrival. */
export interface CountState {
  value: number;
  phase: CountPhase;
  step: number;
}

/** Driving one count: the figure counting up to what the card is worth at this line, standing in
 * its own place for a mark of what the line adds before it takes it on. */
export function useCountRun(spec: CountRunSpec): CountState {
  const [value, setValue] = useState(spec.from);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<CountPhase>('count');
  const frame = useRef(0);
  const lastValue = useRef(spec.from);
  const runUp = useRef(0);
  const lastPhase = useRef<CountPhase>('count');
  const refs: CountRefs = { frame, lastValue, runUp, lastPhase };
  const marked = spec.added !== undefined && spec.addedMark !== undefined;
  const handover = useHandover(refs, setPhase, spec.onBeat);
  useCountRestart(spec, refs, marked, setValue, setPhase);
  useCountFrames(spec, refs, marked, handover, setValue, setStep);
  useCountLog(spec);
  return { value, phase, step };
}
