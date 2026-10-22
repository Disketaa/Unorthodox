import { note } from './Report';

function readIceError(event: Event): { url: string; code: unknown } | undefined {
  const url = Reflect.get(event, 'url');
  const code = Reflect.get(event, 'errorCode');
  if (typeof url !== 'string') return undefined;
  return { url, code };
}

/** Watch a single RTCPeerConnection for ICE and signaling events. Call from the
 * KeepPristineOffer constructor right after super(config). */
export function watchConnection(connection: object): void {
  const born = performance.now();
  const age = () => Math.round(performance.now() - born);
  const addListener = (type: string, listener: (event: Event) => void) => {
    const fn = Reflect.get(connection, 'addEventListener');
    if (typeof fn !== 'function') return;
    fn.apply(connection, [type, listener]);
  };
  addListener('icecandidate', (event) => {
    const candidate = Reflect.get(event, 'candidate');
    note(
      'info',
      `ice +${age()}ms`,
      candidate
        ? `${Reflect.get(candidate, 'type')} ${Reflect.get(candidate, 'protocol')}`
        : 'end'
    );
  });
  addListener('icecandidateerror', (event) => {
    const err = readIceError(event);
    if (err === undefined) return;
    note('warn', `ice error +${age()}ms`, err.url, err.code);
  });
  addListener('iceconnectionstatechange', () => {
    const state = Reflect.get(connection, 'iceConnectionState');
    note('info', `ice state +${age()}ms`, state);
  });
  addListener('signalingstatechange', () => {
    const state = Reflect.get(connection, 'signalingState');
    note('info', `signaling +${age()}ms`, state);
  });
  addListener('icegatheringstatechange', () => {
    const sdp = Reflect.get(Reflect.get(connection, 'localDescription') ?? {}, 'sdp') ?? '';
    const count = String(sdp).split('a=candidate').length - 1;
    const state = Reflect.get(connection, 'iceGatheringState');
    note('info', `gathering +${age()}ms`, state, 'candidates in sdp', count);
  });
}

const watchedSockets = new WeakSet<WebSocket>();
const frameCounts = new Map<string, number>();

/** Watch relay WebSocket frames. Call from relayStates loop. */
export function watchRelayFrames(url: string, socket: WebSocket): void {
  if (watchedSockets.has(socket)) return;
  watchedSockets.add(socket);
  socket.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return;
    try {
      const frame: unknown = JSON.parse(event.data);
      const verb = Array.isArray(frame) ? frame[0] : undefined;
      if (typeof verb !== 'string') return;
      const key = `${url} ${verb}`;
      frameCounts.set(key, (frameCounts.get(key) ?? 0) + 1);
      if (verb !== 'EVENT' && verb !== 'EOSE') {
        note('info', `relay ${url} sent`, event.data.slice(0, 160));
      }
    } catch {
      note('warn', `relay ${url} sent a non-JSON frame`);
    }
  });
}

/** Get frame counts for snapshot. */
export function frameCountSnapshot(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, count] of frameCounts) {
    result[key] = count;
  }
  return result;
}

/** Probe ICE server config and environment. Call once in startDiagnostics. */
export function probeEnvironment(servers: RTCIceServer[]): void {
  try {
    const probe = new RTCPeerConnection({ iceServers: servers });
    probe.close();
    note('info', 'ice servers accepted by this browser');
  } catch (reason) {
    note('error', 'ice servers rejected by this browser', String(reason));
  }
  note('info', 'ua', navigator.userAgent, 'secure', String(window.isSecureContext));
  document.addEventListener('visibilitychange', () => {
    note('info', 'page visibility', document.visibilityState);
  });
}
