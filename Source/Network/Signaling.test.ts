import { describe, it, expect } from 'vitest';
import { OwnRelayUrl, RelayUrls, StunUrls, TurnUrls, iceServers, relayPool, roomConfig } from './Signaling';

const appId = 'unorthodox-game';

function urlsOf(servers: RTCIceServer[]): string[] {
  return servers.map(server => (Array.isArray(server.urls) ? server.urls[0] : server.urls) ?? '');
}

describe('Signaling relays', () => {
  it('announces on the own relay ahead of the public pool', () => {
    // Two peers of a room are most likely to meet on our own relay, and only fall
    // back to a public one on a network where ours is blocked.
    expect(relayPool()[0]).toBe(OwnRelayUrl);
  });

  it('keeps the public pool behind the own relay, so one dead relay is survivable', () => {
    expect(relayPool()).toEqual([OwnRelayUrl, ...RelayUrls]);
  });

  it('keeps the pool short, since a wide one gets rate-limited off the free relays', () => {
    expect(RelayUrls.length).toBeLessThanOrEqual(8);
  });

  it('offers only wss relays, since a page served over https cannot use ws', () => {
    expect(relayPool().every(url => url.startsWith('wss://'))).toBe(true);
  });

  it('never lists the same relay twice', () => {
    const pool = relayPool();
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('keeps no known paywalled or auth-gated relay, which is retired on first announce', () => {
    // Probed live: these refuse an unauthenticated EVENT, so they shrink the pool.
    expect(RelayUrls.some(url => /nostr\.wine|nostr\.info|nostr\.land/.test(url))).toBe(false);
  });

  it('carries the pool into the room configuration', () => {
    expect(roomConfig(appId).relayConfig?.urls).toEqual(relayPool());
  });
});

describe('ICE servers', () => {
  it('never relies on Google STUN, which an RU network cannot reach', () => {
    // Trystero's defaults are all Google apart from Cloudflare, and they are
    // replaced rather than extended.
    expect(StunUrls.some(url => url.includes('google'))).toBe(false);
  });

  it('adds a TURN server after STUN, since a strict NAT has no other path', () => {
    const servers = iceServers();
    expect(urlsOf(servers).slice(0, StunUrls.length)).toEqual(StunUrls);
    expect(servers.length).toBeGreaterThan(StunUrls.length);
  });

  it('keeps our own TURN first, so the pool needs no edit the day coturn runs', () => {
    // The box answers TCP on 3478 and never replies to anything else, so these URLs are dead
    // today. They stay because a URL nothing answers is skipped by the browser rather than
    // failing the peer, and this is where they belong when the server comes back.
    expect(urlsOf(iceServers())).toContain('turn:144.31.61.203:3478');
  });

  it('carries a public TURN as well, since ours answers nothing', () => {
    // With ours dead, this is the only entry a peer can actually allocate on, and the reason a
    // phone can connect at all. A third party in the path is the price of not having a working
    // own server, which the public signaling relays already set.
    expect(TurnUrls.some(url => url.includes('openrelay'))).toBe(true);
  });

  it('gives each TURN server its own credentials, since they differ', () => {
    const turn = iceServers().filter(server => server.username !== undefined);
    expect(turn.length).toBeGreaterThan(1);
    expect(new Set(turn.map(server => server.username)).size).toBe(turn.length);
  });

  it('offers TURN over UDP and TCP together, since one alone is often blocked', () => {
    expect(TurnUrls.some(url => url.includes('transport=tcp'))).toBe(true);
    expect(TurnUrls.some(url => !url.includes('transport=tcp'))).toBe(true);
  });
});

describe('Room configuration', () => {
  it('passes an explicit ICE server list, so the library defaults are replaced', () => {
    expect(roomConfig(appId).rtcConfig?.iceServers).toBeDefined();
  });

  it('keeps the relay failure warnings on, since they are the only signal', () => {
    expect(roomConfig(appId).relayConfig?.warnOnRelayFailure).toBe(true);
  });

  it('sets no redundancy, which trystero would ignore once urls are given', () => {
    expect(roomConfig(appId).relayConfig?.redundancy).toBeUndefined();
  });

  it('carries the app id through, so peers find the same room', () => {
    expect(roomConfig(appId).appId).toBe(appId);
  });
});
