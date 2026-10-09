import { createLogger } from '@/Core';

const log = createLogger('Clock');

/** How far this device's clock is from the server's, in milliseconds. Applied to every reading
 * taken from `Date`, which is what the signalling timestamps come from. */
let offsetMs = 0;

/** Whether the shim is already installed, so a second call does not stack another wrapper. */
let installed = false;

/** The server's clock, as best this device can tell. Falls back to the local clock when the
 * correction has not arrived, which is better than refusing to answer. */
export function serverNow(): number {
  return Date.now() + offsetMs;
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

/** Measure how far off this device is and apply the answer, taken at the midpoint of the round
 * trip rather than on arrival, since one trip out and back otherwise lands a half-trip late.
 * Kept for the page's life: a subscription is rebuilt whenever a relay reconnects. */
export async function syncClockFromServer(): Promise<void> {
  correctClockFromServer();
  try {
    const sent = Date.now();
    const response = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
    const received = Date.now();
    const header = response.headers.get('date');
    if (header === null) {
      log('warn', 'no Date header, so the clock could not be corrected');
      return;
    }
    // Second precision on the header, so the correction is never better than half a second.
    const serverAtArrival = new Date(header).getTime() + (received - sent) / 2;
    offsetMs = Math.round(serverAtArrival - received);
    log('info', 'clock corrected by', offsetMs, 'ms');
  } catch (reason) {
    log('warn', 'clock could not be corrected', String(reason));
  }
}
