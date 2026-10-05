import type { JoinRoomConfig } from 'trystero';

/** The relay this project runs, on a dedicated IP in Moscow. Announcing on it first means the
 * two peers of a room most likely meet here, and the public pool behind it only has to cover a
 * network this one is blocked from. */
export const OwnRelayUrl = 'wss://relay.144-31-61-203.sslip.io';

/** Signaling relays to fall back on, two peers needing only one in common. Kept short on
 * purpose: every entry is another announce burst a free relay must absorb, and a wide pool got
 * this project rate-limited off several of them. */
export const RelayUrls = [
  'wss://nos.lol',
  'wss://nostr.mom',
  'wss://relay.snort.social',
  'wss://relay.primal.net',
  'wss://nostr.islandarea.net',
  'wss://relay.mostro.network',
];

/** STUN servers used to discover a public address for this device. Trystero's defaults are
 * Google servers a Russian network cannot reach without a VPN, and `iceServers` replaces
 * trystero's list outright, so they are replaced here rather than extended. */
export const StunUrls = ['stun:stun.cloudflare.com:3478', 'stun:stun.miwifi.com:3478'];

/** Every relay to announce on: the own relay ahead of the public pool, never instead of it, so
 * our relay being blocked on one network costs that network its redundancy, not its room. */
export function relayPool(): string[] {
  return [OwnRelayUrl, ...RelayUrls];
}

/** TURN servers, which is what a peer behind carrier NAT has to connect through. Ours answers
 * TCP on 3478 and nothing else, and cannot be logged into, so it is kept and a public one
 * follows it. One entry per server, since credentials belong to a server and not to a list. */
const TurnServers: RTCIceServer[] = [
  {
    urls: ['turn:144.31.61.203:3478', 'turn:144.31.61.203:3478?transport=tcp'],
    username: 'game',
    credential: 'unorthodox-2026-static-secret',
  },
  {
    urls: [
      'turn:openrelay.metered.ca:3478',
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:80?transport=tcp',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelay.metered.ca',
    credential: 'openrelay.metered.ca',
  },
];

/** Every TURN URL offered, for tests and for saying what the pool contains. */
export const TurnUrls = TurnServers.flatMap(server =>
  (Array.isArray(server.urls) ? server.urls : [server.urls ?? '']),
);

/** ICE servers to offer, TURN included, since without it a strict NAT has no path at all. */
export function iceServers(): RTCIceServer[] {
  const stun = StunUrls.map(url => ({ urls: url }));
  return [...stun, ...TurnServers];
}

/** Full trystero room configuration. `redundancy` is deliberately absent: trystero applies it
 * only when it picks relays from its own defaults, so setting it would look like a guarantee
 * that was never in effect. */
export function roomConfig(appId: string): JoinRoomConfig {
  return {
    appId,
    relayConfig: { urls: relayPool(), warnOnRelayFailure: true },
    rtcConfig: { iceServers: iceServers() },
  };
}
