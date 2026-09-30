import { createLogger } from '@/Core';
import { getRelaySockets } from 'trystero';

const log = createLogger('Diagnostics');

/** How often the connection snapshot is written to the console. */
const PollIntervalMs = 3_000;

/**
 * True when debug output was requested. The flag is accepted in the query
 * string, anywhere in the hash, or in localStorage, so that it survives every
 * shape of link the app produces.
 */
export function isDebugEnabled(): boolean {
  try {
    if (localStorage.getItem('debug') !== null) {
      return true;
    }
  } catch {
    // Storage may be unavailable; fall through to the URL checks.
  }
  return (
    new URLSearchParams(window.location.search).has('debug') ||
    new URLSearchParams(window.location.hash.split('?')[1] ?? '').has('debug')
  );
}

/** Reads the relay socket table from the installed trystero nostr strategy. */
function relayStates(): Record<string, string> {
  const states: Record<string, string> = {};
  const table = getRelaySockets();
  if (typeof table !== 'object' || table === null) {
    return states;
  }  for (const [url, entry] of Object.entries(table)) {
    states[url] = socketState(readSocket(entry));
  }
  return states;
}

/** Read a readyState off a socket table entry without casting it. */
function readSocket(entry: unknown): WebSocket | undefined {
  if (typeof entry !== 'object' || entry === null) {
    return undefined;
  }
  const socket = Reflect.get(entry, 'socket');
  return socket instanceof WebSocket ? socket : undefined;
}

/** WebSocket readyState as a readable label. */
function socketState(socket: WebSocket | undefined): string {
  if (!socket) {
    return 'absent';
  }
  return ['connecting', 'open', 'closing', 'closed'][socket.readyState] ?? 'unknown';
}

function peerStates(getPeers: () => Record<string, RTCPeerConnection>): Record<string, string> {
  const states: Record<string, string> = {};
  for (const [peerId, connection] of Object.entries(getPeers())) {
    states[peerId] = `conn=${connection.connectionState} ice=${connection.iceConnectionState}`;
  }
  return states;
}

function snapshot(label: string, getPeers: () => Record<string, RTCPeerConnection>): void {
  const peers = peerStates(getPeers);
  log('info', `[${label}] relays`, relayStates(), 'peers', peers);
  const peerIds = Object.keys(peers);
  if (peerIds.length === 0) {
    log('info', `[${label}] no peers discovered yet`);
  }
}

/** Log ICE gathering transitions, which is where a blocked network shows up. */
function reportIceGathering(getPeers: () => Record<string, RTCPeerConnection>): void {
  for (const [peerId, connection] of Object.entries(getPeers())) {
    connection.addEventListener('icegatheringstatechange', () => {
      log('info', `ice gathering for ${peerId} is ${connection.iceGatheringState}`);
    });
    connection.addEventListener('connectionstatechange', () => {
      log('info', `connection for ${peerId} is ${connection.connectionState}`);
    });
  }
}

/**
 * Start periodic connection logging.
 *
 * All of it is written at `info` so it is visible without any extra flag, since
 * a silent connection is the failure mode that matters most here.
 */
export function startDiagnostics(getPeers: () => Record<string, RTCPeerConnection>): () => void {
  const build = document.querySelector('script[src*="assets/index-"]')?.getAttribute('src') ?? 'unknown';
  log('info', 'build', build, 'debug', String(isDebugEnabled()));
  log('info', 'href', window.location.href);

  window.addEventListener('error', (event) => {
    log('error', 'uncaught error', event.message, event.filename, event.lineno);
  });
  window.addEventListener('unhandledrejection', (event) => {
    log('error', 'unhandled rejection', String(event.reason));
  });

  const timer = setInterval(() => snapshot('status', getPeers), PollIntervalMs);
  snapshot('initial', getPeers);
  reportIceGathering(getPeers);
  return () => clearInterval(timer);
}
