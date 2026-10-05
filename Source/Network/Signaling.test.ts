import { describe, it, expect, afterEach, vi } from 'vitest';
import { RelayUrls, StunUrls, iceServers, roomConfig } from './Signaling';

const appId = 'unorthodox-game';

function urlsOf(servers: RTCIceServer[]): string[] {
  return servers.map(server => (Array.isArray(server.urls) ? server.urls[0] : server.urls) ?? '');
}

describe('Signaling relays', () => {
  it('offers more relays than are needed, so one being unreachable is survivable', () => {
    // A single unreachable relay must not take the room down with it.
    expect(RelayUrls.length).toBeGreaterThan(1);
  });

  it('offers only wss relays, since a page served over https cannot use ws', () => {
    expect(RelayUrls.every(url => url.startsWith('wss://'))).toBe(true);
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
