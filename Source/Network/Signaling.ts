import type { JoinRoomConfig, TurnServerConfig } from 'trystero';

/**
 * Signaling relays used for matchmaking; only one needs to be reachable.
 *
 * Measured from a Russian network in September 2026: nos.lol, relay.snort.social
 * and nostr.mom answered a live Nostr REQ, while relay.damus.io and nostr.wine
 * refused the WebSocket handshake outright. Three working relays is the floor
 * worth keeping, so the list mixes both groups rather than betting on either.
 */
export const RelayUrls = [
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.mom',
  'wss://relay.damus.io',
  'wss://nostr.wine',
];

/**
 * STUN servers used to discover a public address for this device.
 *
 * Trystero's own defaults are stun.l.google.com and stun1.l.google.com, which a
 * Russian network cannot reach without a VPN. Two peers behind different NATs
 * need a server-reflexive candidate from a reachable STUN server, so the
 * defaults are replaced here rather than extended: `rtcConfig.iceServers`
 * replaces trystero's list outright instead of adding to it.
 */
export const StunUrls = ['stun:stun.cloudflare.com:3478', 'stun:stun.miwifi.com:3478'];

/** Read a build-time variable, treating an absent or empty value as unset. */
function readEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * The TURN server to fall back on, when one has been configured.
 *
 * STUN alone cannot help when both players sit behind symmetric NAT, and no
 * public TURN server is reliable enough to hardcode: they are rate limited or
 * shut down without warning. Credentials are therefore supplied per deploy
 * through VITE_TURN_URL, VITE_TURN_USERNAME and VITE_TURN_CREDENTIAL. Without
 * them the app still connects on any ordinary home network.
 */
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

/**
 * Full trystero room configuration.
 *
 * `redundancy` is deliberately absent: trystero applies it only when it picks
 * relays from its own defaults, and ignores it entirely once `urls` is given,
 * so setting it would have looked like a guarantee that was never in effect.
 * `warnOnRelayFailure` stays on, because a relay that rejects or drops the
 * handshake is the first thing worth knowing when a room will not connect.
 */
export function roomConfig(appId: string): JoinRoomConfig {
  return {
    appId,
    relayConfig: { urls: RelayUrls, warnOnRelayFailure: true },
    rtcConfig: { iceServers: iceServers() },
  };
}