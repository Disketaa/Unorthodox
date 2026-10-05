import { note } from './Report';

/** Skew past which announces actually stop being delivered, since trystero re-announces every
 * 5.3s and a few seconds of NTP drift is ordinary rather than a fault. */
const SkewWorthWarningAbout = 5;

/** How far this device's clock is from the server's, in seconds. Nostr subscriptions carry a
 * `since` from the local clock, so a phone far enough out stops hearing the other peer with
 * every relay open and nothing logged, which is what this exists to catch. */
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
 * nothing, which reads exactly like a network that was merely quiet. */
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

/** Ask our own ICE servers what they can reach, one probe per TURN server since a pool that half
 * answers is the ordinary case. The peers trystero hands over are only those that fully
 * connected, so a room that never opens leaves nothing to listen to. */
export async function probeIcePath(iceServers: RTCIceServer[]): Promise<void> {
  const stun = iceServers.filter(server => !serverHasTurn(server));
  const turn = iceServers.filter(server => serverHasTurn(server));
  await probeOnce('stun', stun);
  for (const server of turn) {
    await probeOnce(urlsOf(server).join(' '), [server]);
  }
}

/** Whether an ICE server entry wants a TURN credential, which is what separates the two kinds. */
function serverHasTurn(server: RTCIceServer): boolean {
  return urlsOf(server).some(url => url.startsWith('turn'));
}

function urlsOf(server: RTCIceServer): string[] {
  return Array.isArray(server.urls) ? server.urls : [server.urls ?? ''];
}

/** Gather from one set of servers and say what it produced. A relay candidate names the server
 * it came from; its absence is the answer when there is nothing else to report. */
async function probeOnce(label: string, iceServers: RTCIceServer[]): Promise<void> {
  const probe = new RTCPeerConnection({ iceServers });
  const types = new Set<string>();
  let relayed = false;
  probe.addEventListener('icecandidate', (event) => {
    if (event.candidate === null) {
      note(
        'info',
        `ice probe ${label}`,
        types.size ? [...types].join(' ') : 'nothing',
        relayed ? 'relay available' : 'no relay',
      );
      probe.close();
      return;
    }
    types.add(event.candidate.type ?? 'unknown');
    if (event.candidate.type === 'relay') {
      relayed = true;
      note(
        'info',
        `ice probe ${label} relayed over ${event.candidate.protocol ?? '?'}`,
        event.candidate.address ?? '',
      );
    }
  });
  probe.addEventListener('icecandidateerror', (event) => {
    // The browser reports a TURN allocation failure here and nowhere else, and its errorCode is
    // what separates a blocked port from a rejected credential from a server that is not there.
    note('warn', `ice probe ${label} failed`, event.errorCode, event.errorText);
  });
  try {
    probe.createDataChannel('probe');
    await probe.setLocalDescription(await probe.createOffer());
  } catch (reason) {
    note('warn', `ice probe ${label} could not start`, String(reason));
    probe.close();
  }
}
