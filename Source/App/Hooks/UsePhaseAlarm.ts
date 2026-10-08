import { useEffect, useRef } from 'preact/hooks';
import { GameConfig } from '@/Game';
import { playSound } from '@/Design/Sounds';

/** What the last armed deadline was, kept across the render in which the phase changed. */
interface Armed {
  deadline: number;
  rang: boolean;
}

/** The clock the alarm follows, which is the one the block above is drawn on. `ringing` is false
 * for a block with no end to announce, and `paused` holds the whole thing off. */
export interface AlarmClock {
  deadline: number;
  ringing: boolean;
  paused: boolean;
}

/** The alarm at the end of whatever clock the block at the top is drawn on, heard on every
 * client from its own clock. Armed against that block's deadline rather than the phase's, since
 * a sub-phase swaps the block onto a clock of its own while the phase is unchanged. */
export function usePhaseAlarm({ deadline, ringing, paused }: AlarmClock): void {
  const armed = useRef<Armed | null>(null);

  useEffect(() => {
    const { alarmEarlyMs, alarmStaleMs } = GameConfig.timing;
    const now = Date.now();

    // The state beat the deadline by a hair: ring now, since nothing else will. A held room is
    // the exception: the host has already answered the deadline by holding it, and the hold itself
    // is what the players were told, so a second telling here would sound over the pause.
    const previous = armed.current;
    armed.current = null;
    if (
      previous !== null &&
      !previous.rang &&
      !paused &&
      now >= previous.deadline - alarmEarlyMs &&
      now - previous.deadline <= alarmStaleMs
    ) {
      playSound('Alarm');
    }

    // Already over when this browser hears of it: a late joiner or a woken tab is given the
    // room as it stands, and must not go off for a phase it never watched end.
    if (!ringing || paused || deadline <= now) return;

    const current: Armed = { deadline, rang: false };
    armed.current = current;
    const id = setTimeout(() => {
      current.rang = true;
      // A tab that was suspended past the deadline wakes into a phase that has moved on. Playing
      // then would be an alarm for something the player never watched end.
      if (Date.now() - deadline <= alarmStaleMs) playSound('Alarm');
    }, deadline - now);
    return () => clearTimeout(id);
  }, [ringing, paused, deadline]);
}
