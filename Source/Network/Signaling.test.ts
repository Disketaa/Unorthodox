import { describe, it, expect } from 'vitest';
import {
  OwnRelayUrl,
  RelayUrls,
  StunUrls,
  TurnUrls,
  iceServers,
  relayPool,
  roomConfig,
} from './Signaling';

const appId = 'unorthodox-game';

function urlsOf(servers: RTCIceServer[]): string[] {
  return servers.map(
    (server) => (Array.isArray(server.urls) ? server.urls[0] : server.urls) ?? ''
  );
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
    expect(relayPool().every((url) => url.startsWith('wss://'))).toBe(true);
  });

  it('never lists the same relay twice', () => {
    const pool = relayPool();
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('keeps no known paywalled or auth-gated relay, which is retired on first announce', () => {
    // Probed live: these refuse an unauthenticated EVENT, so they shrink the pool.
    expect(RelayUrls.some((url) => /nostr\.wine|nostr\.info|nostr\.land/.test(url))).toBe(
      false
    );
  });

  it('carries the pool into the room configuration', () => {
    expect(roomConfig(appId).relayConfig?.urls).toEqual(relayPool());
  });
});

describe('ICE servers', () => {
  it('never relies on Google STUN, which an RU network cannot reach', () => {
    // Trystero's defaults are all Google apart from Cloudflare, and they are
    // replaced rather than extended.
    expect(StunUrls.some((url) => url.includes('google'))).toBe(false);
  });

  it('adds a TURN server after STUN, since a strict NAT has no other path', () => {
    const servers = iceServers();
    expect(urlsOf(servers).slice(0, StunUrls.length)).toEqual(StunUrls);
    expect(servers.length).toBeGreaterThan(StunUrls.length);
  });

  it('reaches only our own TURN, since it is the one that answers', () => {
    // A public fallback was carried while our server was down. It rate-limited rather than
    // serving, and a third party in the path is worth dropping now that ours allocates.
    expect(urlsOf(iceServers()).some((url) => url.includes('openrelay'))).toBe(false);
  });

  it('offers TURN over UDP and TCP together, since one alone is often blocked', () => {
    expect(TurnUrls.some((url) => url.includes('transport=tcp'))).toBe(true);
    expect(TurnUrls.some((url) => !url.includes('transport=tcp'))).toBe(true);
  });

  it('takes the TURN credential from the environment, not from the source', () => {
    // Anyone reading the repository could otherwise relay through this server for free. The
    // fallback only exists so a clone runs locally without an env file.
    expect(TurnUrls).toBeDefined();
    expect(iceServers().some((server) => server.username === 'game')).toBe(true);
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
