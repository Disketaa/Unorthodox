import { describe, it, expect } from 'vitest';
import { setup, deliverTo } from './TrysteroRoomHarness';
import { HelloAction, HostRole, PlayerRole } from './TrysteroRoom';

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

  it('tells the session the host became addressable exactly once', () => {
    const client = setup(false);
    deliverTo(client.hello, 'host-peer-1', { type: HelloAction, role: HostRole });
    deliverTo(client.hello, 'host-peer-1', { type: HelloAction, role: HostRole });
    expect(client.hostReadyCalls).toHaveLength(1);
  });

  it('ignores a player announcement, since only the host is addressable', () => {
    const client = setup(false);
    deliverTo(client.hello, 'other-player', { type: HelloAction, role: PlayerRole });
    expect(client.hostPeer.get()).toBeNull();
  });
});

describe('Room role handshake robustness', () => {
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
    expect(hello.sent.every(entry => entry.target === undefined)).toBe(true);
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

describe('Room channel subscription', () => {
  it('listens on the client channel when hosting and the host channel when playing', () => {
    // A trystero action is a topic, so a peer only receives what it subscribed
    // to. The host must listen on the channel clients send on.
    const host = setup(true);
    expect(host.clientToHost.onMessage).not.toBeNull();
    expect(host.hostToClient.onMessage).toBeNull();

    const client = setup(false);
    expect(client.hostToClient.onMessage).not.toBeNull();
    expect(client.clientToHost.onMessage).toBeNull();
  });

  it('delivers a client message to the host, tagged as coming from a client', () => {
    const host = setup(true);
    deliverTo(host.clientToHost, 'player-1', { type: 'Join', name: 'Ann' });
    expect(host.received).toEqual([
      { message: { type: 'Join', name: 'Ann' }, fromHost: false, peerId: 'player-1' },
    ]);
  });

  it('delivers a host message to the client, tagged as coming from the host', () => {
    const client = setup(false);
    deliverTo(client.hostToClient, 'host-1', { type: 'State' });
    expect(client.received).toEqual([
      { message: { type: 'State' }, fromHost: true, peerId: 'host-1' },
    ]);
  });

  it('does not feed a peer its own channel back to it', () => {
    const host = setup(true);
    // The host never sends on the client channel, so nothing should arrive.
    deliverTo(host.hostToClient, 'player-1', { type: 'Join', name: 'Ann' });
    expect(host.received).toEqual([]);
  });
});
