import { Transport } from './Transport';

type ClientFrame =
  | { type: 'Open'; room: string; role: 'Host' | 'Player' }
  | { type: 'ToHost'; data: unknown }
  | { type: 'ToPeer'; peerId: string; data: unknown }
  | { type: 'Broadcast'; data: unknown };

type ServerFrame =
  | { type: 'Opened'; peerId: string; hostPresent: boolean }
  | { type: 'HostReady' }
  | { type: 'PeerLeft'; peerId: string }
  | { type: 'HostLeft' }
  | { type: 'Data'; fromHost: boolean; peerId: string; data: unknown };

/** WebSocket transport to the self-hosted relay on the VPS. Replaces TrysteroTransport. One
 * WebSocket per browser, one room per WebSocket. The relay routes messages between host and
 * clients; the host is authoritative and never leaves. */
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
    const url = `wss://relay.144-31-61-203.sslip.io/game`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.send({ type: 'Open', room: roomCode, role: isHost ? 'Host' : 'Player' });
    };
    this.ws.onmessage = (event: MessageEvent) => this.onWebSocketMessage(event);
    this.ws.onclose = () => {
      this.hostPresent = false;
      this.ws = null;
      this.scheduleReconnect(roomCode, isHost);
    };
    this.ws.onerror = () => {
      this.hostPresent = false;
      this.ws?.close();
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
    this.ws?.close();
    this.ws = null;
    this.hostPresent = false;
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
    }
  }

  private scheduleReconnect(roomCode: string, isHost: boolean): void {
    if (this.reconnectTimeout !== null) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30_000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(roomCode, isHost);
    }, delay);
  }
}
