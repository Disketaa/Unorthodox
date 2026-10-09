import { createLogger } from '@/Core';

const log = createLogger('Clock');

/** How far off this device may be before correcting it. Below this the patch costs more than it
 * buys: trystero's announce interval is about five seconds, so an offset smaller than the two
 * second floor never costs a peer, and a device left alone runs no patched code at all. */
export const OffsetWorthCorrecting = 2_000;

/** How the correction went, which is what a player is told when they cannot join a room. The
 * failure is the one worth naming: a proxy or a captive portal can answer the request with a
 * header of its own, and the clock bug it lets through is otherwise completely silent. */
export type ClockStatus = 'measuring' | 'fine' | 'corrected' | 'failed';

/** How far this device's clock is from the server's, in milliseconds. Applied to every reading
 * taken from `Date`, which is what the signalling timestamps come from. */
let offsetMs = 0;

/** Whether the shim is already installed, so a second call does not stack another wrapper. */
let installed = false;

let status: ClockStatus = 'measuring';

/** How the correction went, for the room screen to report on. */
export function clockStatus(): ClockStatus {
  return status;
}

/** How far off this device was, in milliseconds, negative when it runs behind. */
export function clockOffsetMs(): number {
  return offsetMs;
}

/** Redirect `Date.now` at the server's clock. Trystero timestamps subscriptions and
 * announcements from it and compares them across machines, so a drifting clock stops a peer
 * hearing anyone while every relay still reports open. One shared value fixes both directions. */
export function correctClockFromServer(): void {
  if (installed) {
    return;
  }
  installed = true;
  const local = Date.now.bind(Date);
  Date.now = () => local() + offsetMs;
}

/** Take the second chance when page load has not answered, which is a room opened early or a
 * first attempt that failed. Never re-measures a settled answer: moving the offset under a
 * running room would shift every duration it is timing. */
export function ensureClockCorrected(): void {
  correctClockFromServer();
  if (status === 'measuring') {
    void syncClockFromServer();
  }
}

/** Measure how far off this device is and apply the answer, at the midpoint of the round trip
 * rather than on arrival, so one trip out and back does not land a half-trip late. */
export async function syncClockFromServer(): Promise<void> {
  correctClockFromServer();
  try {
    const sent = Date.now();
    const response = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
    const received = Date.now();
    const header = response.headers.get('date');
    if (header === null) {
      status = 'failed';
      log('warn', 'no Date header, so the clock could not be checked');
      return;
    }
    // Second precision on the header, so the correction is never better than half a second.
    const measured = Math.round(new Date(header).getTime() + (received - sent) / 2 - received);
    if (Math.abs(measured) < OffsetWorthCorrecting) {
      status = 'fine';
      return;
    }
    offsetMs = measured;
    status = 'corrected';
    log('info', 'clock corrected by', offsetMs, 'ms');
  } catch (reason) {
    status = 'failed';
    log('warn', 'clock could not be checked', String(reason));
  }
}
