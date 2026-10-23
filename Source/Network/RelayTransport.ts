import { Transport } from './Transport';
import {
  RelayUrl,
  relayClosed,
  relayConnecting,
  relayDropped,
  relayError,
  relayHostLeft,
  relayIdle,
  relayOpen,
  relayOpened,
  relayReconnectScheduled,
} from './RelayLog';
import type { ClientFrame, ServerFrame } from './RelayFrames';

/** WebSocket transport to the self-hosted relay on the VPS. One WebSocket per browser, one room
 * per WebSocket. The relay routes messages between host and clients. */
export class RelayTransport implements Transport {
  private ws: WebSocket | null = null;
  private playerId = '';
  private hostPresent = false;
  private onMessageCb:
    ((message: unknown, fromHost: boolean, peerId: string) => void) | undefined;
  private onPeerLeaveCb: ((playerId: string) => void) | undefined;
  private onHostReadyCb: (() => void) | undefined;
  private onHostLeaveCb: (() => void) | undefined;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;

  sendToHost(message: unknown): void {
    this.send({ type: 'ToHost', data: message });
  }

  sendToPeer(peerId: string, message: unknown): void {
    this.send({ type: 'ToPeer', peerId, data: message });
  }

  broadcast(message: unknown): void {
    this.send({ type: 'Broadcast', data: message });
  }

  onMessage(callback: (message: unknown, fromHost: boolean, peerId: string) => void): void {
    this.onMessageCb = callback;
  }

  onPeerLeave(callback: (playerId: string) => void): void {
    this.onPeerLeaveCb = callback;
  }

  onHostReady(callback: () => void): void {
    this.onHostReadyCb = callback;
  }

  onHostLeave(callback: () => void): void {
    this.onHostLeaveCb = callback;
  }

  isHostAddressable(): boolean {
    return this.hostPresent;
  }

  start(roomCode: string, _playerName: string, isHost: boolean): void {
    this.stop();
    this.connect(roomCode, isHost);
  }

  private connect(roomCode: string, isHost: boolean): void {
    const url = RelayUrl;
    relayConnecting(this.reconnectAttempts + 1);
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.reconnectAttempts = 0;
      relayOpen();
      this.send({ type: 'Open', room: roomCode, role: isHost ? 'Host' : 'Player' });
    };
    ws.onmessage = (event: MessageEvent) => this.onWebSocketMessage(event);
    ws.onclose = (event: CloseEvent) => {
      if (this.ws !== ws) return;
      this.hostPresent = false;
      this.ws = null;
      relayClosed(event.code, event.reason, event.wasClean);
      this.scheduleReconnect(roomCode, isHost);
    };
    ws.onerror = () => {
      relayError(ws.readyState);
      this.hostPresent = false;
      ws.close();
    };
  }

  private onWebSocketMessage(event: MessageEvent): void {
    if (typeof event.data !== 'string') return;
    let frame: ServerFrame;
    try {
      frame = JSON.parse(event.data);
    } catch {
      return;
    }
    switch (frame.type) {
      case 'Opened':
        this.hostPresent = frame.hostPresent;
        relayOpened(frame.hostPresent);
        if (frame.hostPresent && this.onHostReadyCb) this.onHostReadyCb();
        break;
      case 'HostReady':
        this.hostPresent = true;
        if (this.onHostReadyCb) this.onHostReadyCb();
        break;
      case 'PeerLeft':
        if (this.onPeerLeaveCb) this.onPeerLeaveCb(frame.peerId);
        break;
      case 'HostLeft':
        this.hostPresent = false;
        relayHostLeft();
        if (this.onHostLeaveCb) this.onHostLeaveCb();
        break;
      case 'Data':
        if (this.onMessageCb) this.onMessageCb(frame.data, frame.fromHost, frame.peerId);
        break;
    }
  }

  stop(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    const ws = this.ws;
    this.ws = null;
    this.hostPresent = false;
    relayIdle();
    if (ws) {
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      ws.close();
    }
  }

  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  getPlayerId(): string | null {
    return this.playerId || null;
  }

  private send(frame: ClientFrame): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    } else {
      relayDropped(frame.type);
    }
  }

  private scheduleReconnect(roomCode: string, isHost: boolean): void {
    if (this.reconnectTimeout !== null) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30_000);
    relayReconnectScheduled(delay, this.reconnectAttempts);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(roomCode, isHost);
    }, delay);
  }
}
