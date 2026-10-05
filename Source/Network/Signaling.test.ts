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

  it('adds our TURN server after STUN, since a strict NAT has no other path', () => {
    const servers = iceServers();
    expect(urlsOf(servers)).toEqual([...StunUrls, TurnUrls[0]]);
    expect(servers[servers.length - 1].username).toBe('game');
  });

  it('offers TURN over TLS too, since a phone is more often allowed 443 than 3478', () => {
    // A phone on a mobile network reached every relay and exchanged its SDP, then failed to
    // connect. That is TURN being unreachable rather than signaling being broken, and both
    // remaining URLs were on 3478. A port a carrier leaves open is worth having even when the
    // server is not listening on it yet, since the browser just skips it.
    expect(TurnUrls.some(url => url.startsWith('turns:'))).toBe(true);
  });

  

  it('offers TURN over UDP and TCP together, since one alone is often blocked', () => {
    const turn = iceServers().find(server => server.username !== undefined);
    expect(turn?.urls).toEqual(TurnUrls);
    expect(TurnUrls.some(url => url.includes('transport=tcp'))).toBe(true);
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
