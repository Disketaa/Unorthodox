import type { LogLevel } from '@/Core';

/** Lines kept for the on-screen report, oldest dropped once it is full. A phone cannot open a
 * console, so this is the only way a failing join can be read from one. */
const ReportMax = 200;

/** How wide the stamp in a report line is, so a line can be read back without it. */
const stampLength = '00:00:00.000 '.length;

const report: string[] = [];

/** How many times each line has repeated, and where its copy sits, keyed by the text alone: two
 * ticks of the same poll differ only by when they were written. */
const repeats = new Map<string, { count: number; index: number }>();

/** One value as text, without throwing on something that will not serialise. */
function show(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** One line's worth of text, split from the moment it was written. */
export function reportLine(
  level: LogLevel,
  message: string,
  rest: unknown[],
): { stamp: string; body: string } {
  return {
    stamp: new Date().toISOString().slice(11, 23),
    body: `${level} ${[message, ...rest].map(show).join(' ')}`,
  };
}

/** Put a line in the report, or count it onto the copy already there. Returns whether the line
 * was new, which is the caller's cue to log it — a minute of polling is mostly the same
 * sentence, and a repeat carries nothing the first one did not. */
export function fold(stamp: string, body: string): boolean {
  const seen = repeats.get(body);
  if (seen !== undefined) {
    seen.count += 1;
    report[seen.index] = `${stamp} ${body} x${seen.count}`;
    return false;
  }
  report.push(`${stamp} ${body}`);
  repeats.set(body, { count: 1, index: report.length - 1 });
  if (report.length > ReportMax) {
    // Dropping the oldest line shifts every index below it down by one, so the index each count
    // holds has to move with it, and the evicted line has to be forgotten: left in the map it
    // would fold a later recurrence into an entry nobody can read any more.
    const evicted = report.shift()?.slice(stampLength) ?? '';
    repeats.delete(evicted.replace(/ x\d+$/, ''));
    for (const entry of repeats.values()) {
      entry.index = Math.max(0, entry.index - 1);
    }
  }
  return true;
}

/** The connection story so far, for a player to hand over when a room will not open. Carries the
 * user agent and the address, and no TURN credentials, which are deliberately never logged. */
export function getDiagnosticsReport(): string {
  return [`agent ${navigator.userAgent}`, `href ${window.location.href}`, ...report].join('\n');
}
