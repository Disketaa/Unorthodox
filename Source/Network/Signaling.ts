import type { JoinRoomConfig, TurnServerConfig } from 'trystero';

/** Signaling relays used for matchmaking; only one needs to be reachable. Measured from a
 * Russian network in September 2026: nos.lol, relay.snort.social and nostr.mom answered a live
 * Nostr REQ; relay.damus.io and nostr.wine refused the handshake outright. */
export const RelayUrls = [
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.mom',
  'wss://relay.damus.io',
  'wss://nostr.wine',
];

/** STUN servers used to discover a public address for this device. Trystero's defaults are
 * Google servers a Russian network cannot reach without a VPN, and `iceServers` replaces
 * trystero's list outright, so they are replaced here rather than extended. */
export const StunUrls = ['stun:stun.cloudflare.com:3478', 'stun:stun.miwifi.com:3478'];

/** Read a build-time variable, treating an absent or empty value as unset. */
function readEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** The TURN server to fall back on, when one has been configured. STUN alone cannot help when
 * both players sit behind symmetric NAT, and no public TURN server is reliable enough to
 * hardcode, so credentials are supplied per deploy. */
function turnServer(): TurnServerConfig | undefined {
  const url = readEnv('VITE_TURN_URL');
  const username = readEnv('VITE_TURN_USERNAME');
  const credential = readEnv('VITE_TURN_CREDENTIAL');
  if (url === undefined || username === undefined || credential === undefined) {
    return undefined;
  }
  return { urls: url, username, credential };
}

/** ICE servers to offer, with the configured TURN server appended when present. */
export function iceServers(): RTCIceServer[] {
  const stun = StunUrls.map(url => ({ urls: url }));
  const turn = turnServer();
  return turn === undefined ? stun : [...stun, turn];
}

/** Full trystero room configuration. `redundancy` is deliberately absent: trystero applies it
 * only when it picks relays from its own defaults, so setting it would look like a guarantee
 * that was never in effect. */
export function roomConfig(appId: string): JoinRoomConfig {
  return {
    appId,
    relayConfig: { urls: RelayUrls, warnOnRelayFailure: true },
    rtcConfig: { iceServers: iceServers() },
  };
}