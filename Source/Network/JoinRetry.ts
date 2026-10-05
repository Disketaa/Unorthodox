import { Transport } from './Transport';
import { ClientMessage } from './Protocol';
import { createLogger } from '@/Core';

const log = createLogger('JoinRetry');

/** How often a join is re-sent while waiting for the host to become reachable. */
export const JoinRetryIntervalMs = 2_000;

/** A join that has to survive the host not being there yet. The first attempt goes as soon as
 * the transport reports the host addressable, which is the common case. A timer backs it up,
 * for a lost message or a missed addressable moment. */
export class JoinRetry {
  private message: ClientMessage | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly transport: Transport) {}

  /** Hold a join and send it now if the host can be reached. */
  send(message: ClientMessage): void {
    this.message = message;
    this.flush();
    this.startTimer();
  }

  /** Send the held join at once, used when the host announces itself. */
  flush(): void {
    if (this.message === null) {
      return;
    }
    // The host has to announce itself before it can be addressed. Reporting a send
    // that the transport is about to drop is what made a room that never connected
    // look as though it was.
    if (!this.transport.isHostAddressable()) {
      log('debug', 'host has not announced itself yet, holding the join back');
      return;
    }
    log('info', 'host is reachable, sending the join now');
    this.transport.sendToHost(this.message);
  }

  /** The host has answered or refused, so nothing is left to keep sending. */
  stop(): void {
    this.message = null;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startTimer(): void {
    if (this.timer !== null) {
      return;
    }
    this.timer = setInterval(() => this.flush(), JoinRetryIntervalMs);
  }
}
