import { note } from './Report';

/** The one relay this build talks to. Kept here so the report names the same address the socket
 * opened, instead of a copy that can drift from it. */
export const RelayUrl = 'wss://relay.144-31-61-203.sslip.io/game';

type RelayStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';
let status: RelayStatus = 'idle';

export function relayStateSnapshot(): Record<string, string> {
  return { [RelayUrl]: status };
}

/** Whether the relay socket is open right now. A client uses this to tell "the room is not
 * answering" apart from "this device never reached the relay at all". */
export function relayReachable(): boolean {
  return status === 'open';
}

/** No open, error, or close by the deadline: typically a VPN or proxy swallowing the upgrade.
 * Named as a timeout because the browser event carries no reason. */
export function relayConnectTimeout(ms: number): void {
  status = 'error';
  note('warn', 'relay connect timeout', `no open or close after ${ms}ms`);
}

export function relayConnecting(attempt: number): void {
  status = 'connecting';
  note('info', 'relay connecting', `attempt ${attempt}`, RelayUrl);
}

export function relayOpen(): void {
  status = 'open';
  note('info', 'relay socket open');
}

export function relayClosed(code: number, reason: string, wasClean: boolean): void {
  status = 'closed';
  note(
    'warn',
    'relay socket closed',
    `code ${code}`,
    `reason ${reason || '(none)'}`,
    `clean ${wasClean}`
  );
}

export function relayError(readyState: number): void {
  status = 'error';
  note('warn', 'relay socket error', `readyState ${readyState}`);
}

export function relayIdle(): void {
  status = 'idle';
}

export function relayDropped(frameType: string): void {
  note('warn', 'relay frame dropped, socket not open', frameType, `state ${status}`);
}

/** How long a socket may sit in CONNECTING before it is treated as swallowed. Browsers can leave
 * a blocked upgrade pending for a minute or more, which reads as a hang. */
export const RelayConnectTimeoutMs = 8_000;

/** Arm the connect deadline. Returns the disarm, called once the socket opens or is abandoned. */
export function watchRelayConnect(onTimeout: () => void): () => void {
  const timer = setTimeout(() => {
    relayConnectTimeout(RelayConnectTimeoutMs);
    onTimeout();
  }, RelayConnectTimeoutMs);
  return () => clearTimeout(timer);
}

export function relayReconnectScheduled(delay: number, attempt: number): void {
  note('warn', 'relay reconnect scheduled', `in ${delay}ms`, `attempt ${attempt}`);
}

export function relayOpened(hostPresent: boolean): void {
  note('info', 'relay opened', `hostPresent ${hostPresent}`);
}

export function relayHostLeft(): void {
  note('warn', 'relay said the host left');
}
