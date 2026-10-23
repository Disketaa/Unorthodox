/** The relay's wire format, shared by both sides of the socket. */

export type ClientFrame =
  | { type: 'Open'; room: string; role: 'Host' | 'Player' }
  | { type: 'ToHost'; data: unknown }
  | { type: 'ToPeer'; peerId: string; data: unknown }
  | { type: 'Broadcast'; data: unknown };

export type ServerFrame =
  | { type: 'Opened'; peerId: string; hostPresent: boolean }
  | { type: 'HostReady' }
  | { type: 'PeerLeft'; peerId: string }
  | { type: 'HostLeft' }
  | { type: 'Data'; fromHost: boolean; peerId: string; data: unknown };

/** What a transport does with a frame, split from parsing so the socket file stays about the
 * socket and this file stays about the wire. */
export interface FrameSink {
  opened(hostPresent: boolean): void;
  hostReady(): void;
  peerLeft(peerId: string): void;
  hostLeft(): void;
  data(data: unknown, fromHost: boolean, peerId: string): void;
}

export function dispatchFrame(frame: ServerFrame, sink: FrameSink): void {
  switch (frame.type) {
    case 'Opened':
      sink.opened(frame.hostPresent);
      break;
    case 'HostReady':
      sink.hostReady();
      break;
    case 'PeerLeft':
      sink.peerLeft(frame.peerId);
      break;
    case 'HostLeft':
      sink.hostLeft();
      break;
    case 'Data':
      sink.data(frame.data, frame.fromHost, frame.peerId);
      break;
  }
}
