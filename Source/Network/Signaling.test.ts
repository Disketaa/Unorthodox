import { describe, it, expect, afterEach, vi } from 'vitest';
import { RelayUrls, StunUrls, iceServers, relayPool, roomConfig } from './Signaling';

const appId = 'unorthodox-game';
const ownRelayUrl = 'wss://relay.example.com';

function urlsOf(servers: RTCIceServer[]): string[] {
  return servers.map(server => (Array.isArray(server.urls) ? server.urls[0] : server.urls) ?? '');
}

describe('Signaling relays', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('announces on the own relay the build names', () => {
    vi.stubEnv('VITE_RELAY_URL', ownRelayUrl);
    expect(relayPool()[0]).toBe(ownRelayUrl);
  });

  it('keeps the public pool behind the own relay, so one dead relay is survivable', () => {
    vi.stubEnv('VITE_RELAY_URL', ownRelayUrl);
    expect(relayPool()).toEqual([ownRelayUrl, ...RelayUrls]);
  });

  it('falls back to the public pool alone when no own relay is configured', () => {
    expect(relayPool()).toEqual(RelayUrls);
  });

  it('drops a relay the page could not open, rather than passing it on', () => {
    // A malformed wss URL throws out of `new WebSocket` inside trystero.
    vi.stubEnv('VITE_RELAY_URL', 'ws://relay.example.com');
    expect(relayPool()).toEqual(RelayUrls);
    vi.stubEnv('VITE_RELAY_URL', 'wss://');
    expect(relayPool()).toEqual(RelayUrls);
    vi.stubEnv('VITE_RELAY_URL', 'not a url');
    expect(relayPool()).toEqual(RelayUrls);
  });

  it('never lists the same relay twice', () => {
    // A duplicate in front would announce on the same relay over two sockets.
    vi.stubEnv('VITE_RELAY_URL', RelayUrls[2]);
    const pool = relayPool();
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('carries the own relay into the room configuration', () => {
    vi.stubEnv('VITE_RELAY_URL', ownRelayUrl);
    expect(roomConfig(appId).relayConfig?.urls?.[0]).toBe(ownRelayUrl);
  });
});

describe('ICE servers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses only STUN servers by default', () => {
    expect(urlsOf(iceServers())).toEqual(StunUrls);
  });

  it('never relies on Google STUN, which an RU network cannot reach', () => {
    // Trystero's defaults are all Google apart from Cloudflare, and they are
    // replaced rather than extended.
    expect(StunUrls.some(url => url.includes('google'))).toBe(false);
  });

  it('adds the TURN server when all three of its credentials are configured', () => {
    vi.stubEnv('VITE_TURN_URL', 'turn:turn.example.com:3478');
    vi.stubEnv('VITE_TURN_USERNAME', 'user');
    vi.stubEnv('VITE_TURN_CREDENTIAL', 'secret');

    expect(urlsOf(iceServers())).toEqual([...StunUrls, 'turn:turn.example.com:3478']);
  });

  it('offers TURN over UDP and TCP together, since one alone is often blocked', () => {
    vi.stubEnv('VITE_TURN_URL', 'turn:turn.example.com:3478, turn:turn.example.com:3478?transport=tcp');
    vi.stubEnv('VITE_TURN_USERNAME', 'user');
    vi.stubEnv('VITE_TURN_CREDENTIAL', 'secret');

    const turn = iceServers().find(server => server.username !== undefined);
    expect(turn?.urls).toEqual(['turn:turn.example.com:3478', 'turn:turn.example.com:3478?transport=tcp']);
  });

  it('omits TURN when its credentials are incomplete, rather than half configuring it', () => {
    vi.stubEnv('VITE_TURN_URL', 'turn:turn.example.com:3478');
    vi.stubEnv('VITE_TURN_USERNAME', 'user');

    expect(urlsOf(iceServers())).toEqual(StunUrls);
  });
});

describe('Room configuration', () => {
  it('passes an explicit ICE server list, so the library defaults are replaced', () => {
    const config = roomConfig(appId);
    expect(config.rtcConfig?.iceServers).toBeDefined();
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
