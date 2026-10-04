import { createLogger, setLogLevel } from '@/Core';
import { getRelaySockets } from 'trystero';

const log = createLogger('Diagnostics');

/** How often the connection snapshot is written to the console. */
const PollIntervalMs = 3_000;

/**
 * What the host toggled in the lobby, which beats the flags below: a link may
 * carry ?debug and the host may still want it off, and back the other way. Null
 * until someone actually toggles, so an untouched session reads its own flags.
 */
let override: boolean | null = null;

/**
 * True when debug output was requested. The flag is accepted in the query
 * string, anywhere in the hash, or in localStorage, so that it survives every
 * shape of link the app produces.
 */
export function isDebugEnabled(): boolean {
  if (override !== null) {
    return override;
  }
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

/**
 * Turn debug logging on or off for the rest of this session.
 *
 * Kept in memory rather than storage, so leaving and rejoining finds the room
 * the way the link left it and a stray `?debug` link shared afterwards does not
 * drag the logging along.
 */
export function setDebugEnabled(enabled: boolean): void {
  override = enabled;
  setLogLevel(enabled ? 'debug' : 'info');
  log(enabled ? 'info' : 'warn', enabled ? 'debug logging on' : 'debug logging off');
}

/**
 * Read the relay socket table from the installed trystero nostr strategy.
 *
 * The table maps a relay URL to the live `WebSocket` for it, so a missing entry
 * means the relay has not been dialled yet, or has been dropped for good.
 */
function relayStates(): Record<string, string> {
  const states: Record<string, string> = {};
  const table = getRelaySockets();
  if (typeof table !== 'object' || table === null) {
    return states;
  }
  for (const [url, entry] of Object.entries(table)) {
    states[url] = socketState(readSocket(entry));
  }
  return states;
}

/** Read a readyState off a socket table entry without casting it. */
function readSocket(entry: unknown): WebSocket | undefined {
  return entry instanceof WebSocket ? entry : undefined;
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

/**
 * Last state reported for each relay, so a change is logged once instead of on
 * every tick.
 *
 * Trystero retires a relay permanently once its reconnect backoff runs out, so
 * one going from open to closed never comes back this session and is worth
 * saying out loud.
 */
const lastRelayState = new Map<string, string>();

/** Log a relay transition the first time it is seen. */
function reportRelayChanges(states: Record<string, string>): void {
  for (const [url, state] of Object.entries(states)) {
    if (lastRelayState.get(url) === state) {
      continue;
    }
    lastRelayState.set(url, state);
    if (state === 'closed') {
      log('warn', `relay ${url} closed and will not be retried until reload`);
    } else if (state === 'open') {
      log('info', `relay ${url} is open`);
    } else if (state === 'failed') {
      log('warn', `relay ${url} could not be reached`);
    }
  }
}

function snapshot(label: string, getPeers: () => Record<string, RTCPeerConnection>): void {
  const relays = relayStates();
  const peers = peerStates(getPeers);
  log('info', `[${label}] relays`, relays, 'peers', peers);
  reportRelayChanges(relays);
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
