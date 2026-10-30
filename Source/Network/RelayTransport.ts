import { reportWire } from '@/Core';
import { Transport } from './Transport';
import { dispatchFrame, type ServerFrame } from './RelayFrames';
import { RelaySocket } from './RelaySocket';
import {
  relayHostLeft,
  relayHostReady,
  relayOpened,
  relayPeerLeft,
  relayReachable,
  relayReceived,
} from './RelayLog';

/** WebSocket transport to the self-hosted relay on the VPS. One socket per browser and one room
 * per socket; the host is authoritative and the relay only routes between the two sides. */
export class RelayTransport implements Transport {
  private socket: RelaySocket | null = null;
  private playerId = '';
  private hostPresent = false;
  private onMessageCb:
    ((message: unknown, fromHost: boolean, peerId: string) => void) | undefined;
  private onPeerLeaveCb: ((playerId: string) => void) | undefined;
  private onHostReadyCb: (() => void) | undefined;
  private onHostLeaveCb: (() => void) | undefined;
  private onHostBackCb: (() => void) | undefined;

  sendToHost(message: unknown): void {
    reportWire('tx', message, bytesOf(message));
    this.socket?.send({ type: 'ToHost', data: message });
  }

  sendToPeer(peerId: string, message: unknown): void {
    reportWire('tx', message, bytesOf(message));
    this.socket?.send({ type: 'ToPeer', peerId, data: message });
  }

  broadcast(message: unknown): void {
    reportWire('tx', message, bytesOf(message));
    this.socket?.send({ type: 'Broadcast', data: message });
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

  onHostBack(callback: () => void): void {
    this.onHostBackCb = callback;
  }

  isHostAddressable(): boolean {
    return this.hostPresent;
  }

  isRelayReachable(): boolean {
    return relayReachable();
  }

  start(roomCode: string, _playerName: string, isHost: boolean): void {
    this.stop();
    this.socket = new RelaySocket(roomCode, isHost, {
      onFrame: (event) => this.onFrame(event),
    });
    this.socket.start();
  }

  private onFrame(event: MessageEvent): void {
    if (typeof event.data !== 'string') return;
    let frame: ServerFrame;
    try {
      frame = JSON.parse(event.data);
    } catch {
      return;
    }
    relayReceived(frame);
    reportWire('rx', frame.type === 'Data' ? frame.data : frame, event.data.length);
    dispatchFrame(frame, {
      opened: (hostPresent) => {
        this.hostPresent = hostPresent;
        relayOpened(hostPresent);
        if (hostPresent) {
          this.onHostReadyCb?.();
          this.onHostBackCb?.();
        }
      },
      hostReady: () => {
        this.hostPresent = true;
        relayHostReady();
        this.onHostReadyCb?.();
        this.onHostBackCb?.();
      },
      peerLeft: (peerId) => {
        relayPeerLeft(peerId);
        this.onPeerLeaveCb?.(peerId);
      },
      hostLeft: () => {
        this.hostPresent = false;
        relayHostLeft();
        this.onHostLeaveCb?.();
      },
      data: (data, fromHost, peerId) => this.onMessageCb?.(data, fromHost, peerId),
    });
  }

  stop(): void {
    this.socket?.stop();
    this.socket = null;
    this.hostPresent = false;
  }

  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  getPlayerId(): string | null {
    return this.playerId || null;
  }
}

function bytesOf(message: unknown): number {
  try {
    return JSON.stringify(message)?.length ?? 0;
  } catch {
    return 0;
  }
}
