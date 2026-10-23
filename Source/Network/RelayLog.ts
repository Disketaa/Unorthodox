import { note } from './Report';

/** The one relay this build talks to. Kept here so the report names the same address the socket
 * opened, instead of a copy that can drift from it. */
export const RelayUrl = 'wss://relay.144-31-61-203.sslip.io/game';

type RelayStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';
let status: RelayStatus = 'idle';

export function relayStateSnapshot(): Record<string, string> {
  return { [RelayUrl]: status };
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

export function relayReconnectScheduled(delay: number, attempt: number): void {
  note('warn', 'relay reconnect scheduled', `in ${delay}ms`, `attempt ${attempt}`);
}

export function relayOpened(hostPresent: boolean): void {
  note('info', 'relay opened', `hostPresent ${hostPresent}`);
}

export function relayHostLeft(): void {
  note('warn', 'relay said the host left');
}
