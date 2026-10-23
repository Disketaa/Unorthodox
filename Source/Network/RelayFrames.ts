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
