import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

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

interface Room {
  host: WebSocket | null;
  peers: Map<string, WebSocket>;
  hostGone?: ReturnType<typeof setTimeout>;
}

/** How long a room survives its host's socket dropping. A phone or a VPN tunnel blips for longer
 * than a second, and a room torn down on the first blip is worse than one that waits. */
const HostGraceMs = 10_000;

const rooms = new Map<string, Room>();
const peerIdOf = new WeakMap<WebSocket, string>();
const roomOf = new WeakMap<WebSocket, string>();

function send(ws: WebSocket, frame: ServerFrame): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(frame));
  }
}

function broadcastRoom(room: string, frame: ServerFrame, except?: WebSocket): void {
  const r = rooms.get(room);
  if (!r) return;
  for (const [, ws] of r.peers) {
    if (ws !== except && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame));
    }
  }
  if (r.host && r.host !== except && r.host.readyState === WebSocket.OPEN) {
    r.host.send(JSON.stringify(frame));
  }
}

function onOpen(ws: WebSocket): void {
  const peerId = randomUUID();
  peerIdOf.set(ws, peerId);
  ws.on('message', (raw: string) => {
    let frame: ClientFrame;
    try {
      frame = JSON.parse(raw) as ClientFrame;
    } catch {
      return;
    }
    switch (frame.type) {
      case 'Open': {
        const { room, role } = frame;
        roomOf.set(ws, room);
        let r = rooms.get(room);
        if (!r) {
          r = { host: null, peers: new Map() };
          rooms.set(room, r);
        }
        if (role === 'Host') {
          if (r.hostGone) {
            clearTimeout(r.hostGone);
            r.hostGone = undefined;
            console.log(`host returned room=${room} peer=${peerId}`);
          }
          r.host = ws;
          send(ws, { type: 'Opened', peerId, hostPresent: true });
          broadcastRoom(room, { type: 'HostReady' }, ws);
          console.log(`open room=${room} role=Host peer=${peerId} peers=${r.peers.size}`);
        } else {
          r.peers.set(peerId, ws);
          send(ws, { type: 'Opened', peerId, hostPresent: r.host !== null });
          console.log(
            `open room=${room} role=Player peer=${peerId} host=${r.host !== null} peers=${r.peers.size}`
          );
        }
        break;
      }
      case 'ToHost': {
        const r = rooms.get(roomOf.get(ws) ?? '');
        if (r?.host && r.host.readyState === WebSocket.OPEN) {
          r.host.send(JSON.stringify({ type: 'Data', fromHost: false, peerId, data: frame.data }));
        }
        break;
      }
      case 'ToPeer': {
        const r = rooms.get(roomOf.get(ws) ?? '');
        const target = r?.peers.get(frame.peerId);
        if (r && target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({ type: 'Data', fromHost: r.host === ws, peerId, data: frame.data }));
        }
        break;
      }
      case 'Broadcast': {
        const r = rooms.get(roomOf.get(ws) ?? '');
        if (r) broadcastRoom(roomOf.get(ws) ?? '', { type: 'Data', fromHost: r.host === ws, peerId, data: frame.data }, ws);
        break;
      }
    }
  });
  ws.on('close', (code: number, reason: Buffer) => {
    const room = roomOf.get(ws);
    if (!room) return;
    const r = rooms.get(room);
    if (!r) return;
    const wasHost = r.host === ws;
    console.log(
      `close room=${room} peer=${peerId} code=${code} reason=${reason.toString() || '(none)'} role=${
        wasHost ? 'Host' : 'Player'
      }`
    );
    if (wasHost) {
      r.host = null;
      r.hostGone = setTimeout(() => {
        r.hostGone = undefined;
        if (r.host !== null) return;
        console.log(`host gone room=${room} telling ${r.peers.size} peers`);
        broadcastRoom(room, { type: 'HostLeft' });
        if (r.peers.size === 0) rooms.delete(room);
      }, HostGraceMs);
    } else if (r.peers.delete(peerId)) {
      broadcastRoom(room, { type: 'PeerLeft', peerId }, ws);
      if (r.host === null && r.peers.size === 0) rooms.delete(room);
    }
    peerIdOf.delete(ws);
    roomOf.delete(ws);
  });
  ws.on('error', () => {
    ws.close();
  });
}

const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', onOpen);

setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }
}, 25_000);

console.log('Relay server listening on ws://0.0.0.0:8080');
