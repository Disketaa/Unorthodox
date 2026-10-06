import { note } from './Report';

/** Skew past which announces actually stop being delivered, since trystero re-announces every
 * 5.3s and a few seconds of NTP drift is ordinary rather than a fault. */
const SkewWorthWarningAbout = 5;

/** How far this device's clock is from the server's, in seconds. Nostr subscriptions carry a
 * `since` from the local clock, so a phone far enough out stops hearing the other peer with
 * every relay open and nothing logged. */
export async function reportClockSkew(): Promise<void> {
  try {
    const response = await fetch(location.origin + '/', { method: 'HEAD', cache: 'no-store' });
    const serverDate = response.headers.get('date');
    if (serverDate === null) {
      note('warn', 'no Date header, so the clock skew could not be read');
      return;
    }
    const skewSeconds = Math.round((Date.now() - new Date(serverDate).getTime()) / 1000);
    note(
      skewSeconds > SkewWorthWarningAbout ? 'warn' : 'info',
      'clock skew in seconds',
      skewSeconds,
      skewSeconds > SkewWorthWarningAbout ? 'announces land outside this window' : 'in step',
    );
  } catch (reason) {
    note('warn', 'clock skew could not be read', String(reason));
  }
}

/** Connections already listened to, so a peer arriving on a later tick is reported the same as
 * one present at start. Listening only at start meant a phone that discovered nothing logged
 * nothing. */
const watchedPeers = new Set<RTCPeerConnection>();

/** Log ICE transitions, which is where a blocked network shows up. Candidate types say which of
 * STUN and TURN got through: no srflx means STUN never answered, no relay means TURN was
 * unreachable, and either one looks like an ordinary NAT from the state alone. */
export function reportIceGathering(getPeers: () => Record<string, RTCPeerConnection>): void {
  for (const [peerId, connection] of Object.entries(getPeers())) {
    if (watchedPeers.has(connection)) {
      continue;
    }
    watchedPeers.add(connection);
    connection.addEventListener('icecandidate', (event) => {
      note('info', `candidate for ${peerId}`, event.candidate?.type ?? 'end of candidates');
    });
    connection.addEventListener('icegatheringstatechange', () => {
      note('info', `ice gathering for ${peerId} is ${connection.iceGatheringState}`);
    });
    connection.addEventListener('connectionstatechange', () => {
      note('info', `connection for ${peerId} is ${connection.connectionState}`);
    });
    note('info', `discovered peer ${peerId}`);
  }
}
