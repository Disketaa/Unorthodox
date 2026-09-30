import { describe, it, expect } from 'vitest';
import { wireRoom, HelloAction, HostRole, PlayerRole } from './TrysteroRoom';
import type { RoomActions } from './TrysteroRoom';
import type { JsonValue, MessageAction, MessageContext } from 'trystero';

/** A recorded send, reduced to what the handshake tests care about. */
type Sent = { data: JsonValue; target?: string };

/**
 * A stand-in for a trystero action. It records what was sent and lets a test
 * deliver an incoming message, standing in for the remote side of the wire.
 */
class FakeAction {
  readonly sent: Sent[] = [];
  onMessage: ((data: JsonValue, context: MessageContext) => void) | null = null;

  send = (data: JsonValue, options?: { target?: string | string[] | null }): Promise<void> => {
    const target = options?.target;
    this.sent.push(typeof target === 'string' ? { data, target } : { data });
    return Promise.resolve();
  };
}

/** Bridge a fake onto the action shape the room code is typed against. */
function asAction(fake: FakeAction): MessageAction<JsonValue> {
  return {
    onReceiveProgress: null,
    send: (data, options) => fake.send(data, { target: options?.target }),
    get onMessage() {
      return fake.onMessage;
    },
    set onMessage(handler) {
      fake.onMessage = handler;
    },
  };
}

type FakeRoom = {
  onPeerJoin?: (peerId: string) => void;
  onPeerLeave?: (peerId: string) => void;
};

/** Wire a room for a host or a client, and expose the fakes for inspection. */
function setup(isHost: boolean) {
  const room: FakeRoom = {};
  const hostToClient = new FakeAction();
  const clientToHost = new FakeAction();
  const hello = new FakeAction();
  const actions: RoomActions = {
    hostToClient: isHost ? asAction(hostToClient) : null,
    clientToHost: asAction(clientToHost),
    hello: asAction(hello),
  };
  const hostReadyCalls: string[] = [];
  const hostPeer = wireRoom(room, actions, isHost, {
    onMessage: () => undefined,
    onPeerLeave: () => undefined,
    onHostReady: () => hostReadyCalls.push('ready'),
  });
  return { room, hostToClient, clientToHost, hello, hostPeer, hostReadyCalls };
}

/** Deliver a message as if it arrived from `peerId`. */
function deliverTo(action: FakeAction, peerId: string, data: JsonValue): void {
  action.onMessage?.(data, { peerId });
}

describe('Room role handshake', () => {
  it('announces the host role when the room is wired', () => {
    const { hello } = setup(true);
    expect(hello.sent[0].data).toEqual({ type: HelloAction, role: HostRole });
  });

  it('learns the host peerId from an announcement that arrives after wiring', () => {
    const client = setup(false);
    expect(client.hostPeer.get()).toBeNull();
    deliverTo(client.hello, 'host-peer-1', { type: HelloAction, role: HostRole });
    expect(client.hostPeer.get()).toBe('host-peer-1');
  });

  it('ignores a player announcement, since only the host is addressable', () => {
    const client = setup(false);
    deliverTo(client.hello, 'other-player', { type: HelloAction, role: PlayerRole });
    expect(client.hostPeer.get()).toBeNull();
  });

  it('ignores malformed announcements', () => {
    const client = setup(false);
    deliverTo(client.hello, 'host-peer-1', 'not an object');
    deliverTo(client.hello, 'host-peer-1', { type: HelloAction });
    expect(client.hostPeer.get()).toBeNull();
  });

  it('re-announces on peer join, so a late peer learns the role', () => {
    const host = setup(true);
    const before = host.hello.sent.length;
    host.room.onPeerJoin?.('late-peer');
    expect(host.hello.sent.length).toBe(before + 1);
    expect(host.hello.sent[before].data).toEqual({ type: HelloAction, role: HostRole });
  });

  it('a host does not learn a host peerId from itself', () => {
    const host = setup(true);
    deliverTo(host.hello, 'some-peer', { type: HelloAction, role: HostRole });
    expect(host.hostPeer.get()).toBeNull();
  });
});

describe('Room role handshake delivery', () => {
  it('broadcasts the role rather than targeting one peer, so both orders work', () => {
    const { hello } = setup(true);
    // A targeted send would miss a client that joined before the host, because
    // the host never sees a join event for a peer that is already present.
    expect(hello.sent.every((entry) => entry.target === undefined)).toBe(true);
  });

  it('clears the known host when that peer leaves', () => {
    const client = setup(false);
    deliverTo(client.hello, 'host-peer-1', { type: HelloAction, role: HostRole });
    client.room.onPeerLeave?.('host-peer-1');
    expect(client.hostPeer.get()).toBeNull();
  });

  it('keeps the known host when some other peer leaves', () => {
    const client = setup(false);
    deliverTo(client.hello, 'host-peer-1', { type: HelloAction, role: HostRole });
    client.room.onPeerLeave?.('someone-else');
    expect(client.hostPeer.get()).toBe('host-peer-1');
  });
});
