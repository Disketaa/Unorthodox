import type { ClientFrame } from './RelayFrames';
import {
  RelayUrl,
  relayClosed,
  relayConnecting,
  relayDropped,
  relayError,
  relayIdle,
  relayOpen,
  relayReconnectScheduled,
  relaySent,
  watchRelayConnect,
} from './RelayLog';

export interface RelaySocketHandlers {
  onFrame(event: MessageEvent): void;
}

/** The raw socket: connect, reconnect, and nothing about the game. Kept apart from the transport
 * so neither file has to carry the other's shape. */
export class RelaySocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private connectWatchdog: (() => void) | null = null;
  private attempts = 0;

  constructor(
    private readonly roomCode: string,
    private readonly isHost: boolean,
    private readonly handlers: RelaySocketHandlers
  ) {}

  start(): void {
    this.connect();
  }

  stop(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.disarm();
    const ws = this.ws;
    this.ws = null;
    relayIdle();
    if (ws) {
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      ws.close();
    }
  }

  send(frame: ClientFrame): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
      relaySent(frame.type, 'peerId' in frame ? frame.peerId : undefined);
    } else {
      relayDropped(frame.type);
    }
  }

  private connect(): void {
    relayConnecting(this.attempts + 1);
    const ws = new WebSocket(RelayUrl);
    this.ws = ws;
    ws.binaryType = 'arraybuffer';
    this.connectWatchdog = watchRelayConnect(() => ws.close());
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.disarm();
      this.attempts = 0;
      relayOpen();
      this.send({ type: 'Open', room: this.roomCode, role: this.isHost ? 'Host' : 'Player' });
    };
    ws.onmessage = (event: MessageEvent) => this.handlers.onFrame(event);
    ws.onclose = (event: CloseEvent) => {
      if (this.ws !== ws) return;
      this.disarm();
      this.ws = null;
      relayClosed(event.code, event.reason, event.wasClean);
      this.scheduleReconnect();
    };
    ws.onerror = () => {
      relayError(ws.readyState);
      ws.close();
    };
  }

  private disarm(): void {
    this.connectWatchdog?.();
    this.connectWatchdog = null;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout !== null) return;
    this.attempts++;
    const delay = Math.min(1000 * Math.pow(2, this.attempts - 1), 30_000);
    relayReconnectScheduled(delay, this.attempts);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }
}
