import { useEffect, useRef } from 'preact/hooks';
import { GameConfig, isPhaseName, isTimedPhase } from '@/Game';
import { playSound } from '@/Design/Sounds';
import type { SessionPhase } from './UseSessionPhase';

/** What the last armed deadline was, kept across the render in which the phase changed. */
interface Armed {
  deadline: number;
  rang: boolean;
}

/** The alarm at the end of a timed phase, heard on every client from its own clock. The host's
 * commit of the next one is the announcement, and it arrives after the bar has reached zero.
 * Armed against the same deadline the bar is drawn from. */
export function usePhaseAlarm({ phase, durationMs, phaseStartedAt }: SessionPhase): void {
  const armed = useRef<Armed | null>(null);
  const timed = isPhaseName(phase) && isTimedPhase(phase) && durationMs > 0;
  const deadline = phaseStartedAt + durationMs;

  useEffect(() => {
    const { alarmEarlyMs, alarmStaleMs } = GameConfig.timing;
    const now = Date.now();

    // The state beat the deadline by a hair: ring now, since nothing else will.
    const previous = armed.current;
    armed.current = null;
    if (
      previous !== null &&
      !previous.rang &&
      now >= previous.deadline - alarmEarlyMs &&
      now - previous.deadline <= alarmStaleMs
    ) {
      playSound('Alarm');
    }

    // Already over when this browser hears of it: a late joiner or a woken tab is given the
    // room as it stands, and must not go off for a phase it never watched end.
    if (!timed || deadline <= now) return;

    const current: Armed = { deadline, rang: false };
    armed.current = current;
    const id = setTimeout(() => {
      current.rang = true;
      // A tab that was suspended past the deadline wakes into a phase that has moved on. Playing
      // then would be an alarm for something the player never watched end.
      if (Date.now() - deadline <= alarmStaleMs) playSound('Alarm');
    }, deadline - now);
    return () => clearTimeout(id);
  }, [timed, phase, phaseStartedAt, durationMs]);
}
