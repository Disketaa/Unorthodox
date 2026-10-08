import { useEffect, useState } from 'preact/hooks';
import { GameConfig } from '@/Game';
import type { RandomPick } from '@/Game';
import { hostTimeToLocal, type ThemeId } from '@/Core';
import { playSound } from '@/Design/Sounds';

/** One card of the sweep: which theme the room is looking at, or undefined where nothing is
 * being looked at. */
export interface Sweep {
  looking: ThemeId | undefined;
}

/** How long the room rests on the card it landed on before the roll commits. A sweep that hops
 * right up to the landing is a machine still spinning; the rest is what makes it a decision. */
const SettleMs = GameConfig.timing.pickingSettleMs;

/** Whether this device is asked to watch the sweep at all. Where it is not, the roll is simply
 * the answer and the bank holds still until it lands, rather than the room's looking being
 * taken away as well as its motion. */
function still(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** The card a hop lands on: the count taken into the bank, so past the last card it comes round
 * to the first. */
function hopTo(step: number, count: number): number {
  return step % count;
}

/** How far into a sweep a hop falls, as a share of the whole. Squared, so the early hops crowd
 * together and the late ones spread out. Over the hops there are rather than one past them, so
 * the last lands on the end of the sweep. */
function hopAt(k: number, steps: number): number {
  const span = Math.max(1, steps - 1);
  return (k / span) ** 2;
}

/** Walk the bank card by card from the first card, over the whole of it once and on to the card
 * the room's roll chose. Returns the cleanup. */
function walkBank(
  themes: readonly ThemeId[],
  target: ThemeId,
  localStart: number,
  lookMs: number,
  onLooking: (theme: ThemeId) => void
): () => void {
  const count = themes.length;
  const toTarget = themes.indexOf(target);
  // The whole bank once, then on to the roll's own card. Counted rather than timed, so the last
  // hop is the answer: a walk whose length is set by a clock stops wherever the counting was, and
  // the card lifts somewhere else entirely.
  const steps = toTarget + count + 1;
  const timeOf = (k: number) => lookMs * hopAt(k, steps);
  // Skipped rather than started at: a screen that joined the sweep late walks the rest of it, and
  // lands with the room, rather than beginning a second sweep it was not there for.
  const elapsedMs = Date.now() - localStart;
  let step = 0;
  // Never past the first card, however late this started. The walk's whole reading is that it
  // starts at the top of the bank, and a screen that mounted a frame after the roll began would
  // otherwise skip the opening hops and open mid-bank, which is the one thing it must not do.
  while (step < steps - 1 && timeOf(step + 1) <= elapsedMs) step += 1;
  let id = 0;
  const hop = () => {
    if (step >= steps) return;
    onLooking(themes[hopTo(step, count)]);
    // One note per hop rather than one for the sweep: the bank is being tapped card by card, and a
    // single note under a moving pointer says nothing about which card it moved from. The bank's
    // own scatter does the rest, so a slower sweep is audibly the one slowing down.
    playSound('Tick');
    step += 1;
    id = window.setTimeout(hop, Math.max(0, timeOf(step) - (Date.now() - localStart)));
  };
  hop();
  return () => window.clearTimeout(id);
}

/** Where the room's own roll is, looking over `themes`. Driven off the roll's own start rather
 * than counted from mount, so a screen that joined the sweep late lands with the rest of the
 * room rather than starting the whole thing over. */
export function useThemeSweep(
  picking: RandomPick | undefined,
  themes: readonly ThemeId[],
  clockOffsetMs: number
): Sweep {
  const localStart =
    picking === undefined ? 0 : hostTimeToLocal(picking.startedAt, clockOffsetMs);
  const target = picking?.theme;
  const [looking, setLooking] = useState<ThemeId | undefined>(undefined);
  // In its last stretch the sweep is no longer looking: it is on the card it landed on, and stays
  // there until the room commits, since a card that lifts a moment before the answer it was
  // resting on is a bank reopening under the answer.
  const settled =
    picking !== undefined && Date.now() - localStart >= GameConfig.timing.pickingMs - SettleMs;

  useEffect(() => {
    if (picking === undefined || target === undefined || themes.length === 0 || still()) {
      return;
    }
    return walkBank(
      themes,
      target,
      localStart,
      GameConfig.timing.pickingMs - SettleMs,
      setLooking
    );
  }, [picking, target, localStart, themes]);

  if (picking === undefined || target === undefined) {
    return { looking: undefined };
  }
  return { looking: settled || still() ? target : looking };
}
