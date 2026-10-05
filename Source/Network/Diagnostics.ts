import { createLogger, LogLevel, setLogLevel } from '@/Core';
import { relayPool } from './Signaling';
import { getRelaySockets } from 'trystero';

const log = createLogger('Diagnostics');

/** How often the connection snapshot is written to the console. */
const PollIntervalMs = 3_000;

/** Lines kept for the on-screen report, oldest dropped once it is full. A phone cannot open a
 * console, so this is the only way a failing join can be read from one. */
const ReportMax = 200;

const report: string[] = [];

/** One value as text, without throwing on something that will not serialise. */
function show(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Log to the console and keep a copy, so the report and the console stay the same lines. The
 * logger wants a message and extra detail apart; the report joins them back into one line. */
function note(level: LogLevel, ...parts: unknown[]): void {
  const [message, ...rest] = parts;
  log(level, show(message), ...rest);
  const stamp = new Date().toISOString().slice(11, 23);
  report.push(`${stamp} ${level} ${parts.map(show).join(' ')}`);
  if (report.length > ReportMax) {
    report.shift();
  }
}

/** The connection story so far, for a player to hand over when a room will not open. Carries the
 * user agent and the address, and no TURN credentials, which are deliberately never logged. */
export function getDiagnosticsReport(): string {
  return [`agent ${navigator.userAgent}`, `href ${window.location.href}`, ...report].join('\n');
}

/** What the host toggled in the lobby, which beats the flags below: a link may carry ?debug and
 * the host may still want it off, and back the other way. Null until someone actually toggles,
 * so an untouched session reads its own flags. */
let override: boolean | null = null;

/** True when debug output was requested. The flag is accepted in the query string, anywhere in
 * the hash, or in localStorage, so that it survives every shape of link the app produces. */
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

/** Turn debug logging on or off for the rest of this session. Kept in memory rather than
 * storage, so leaving and rejoining finds the room the way the link left it and a stray
 * `?debug` link shared afterwards does not drag the logging along. */
export function setDebugEnabled(enabled: boolean): void {
  override = enabled;
  setLogLevel(enabled ? 'debug' : 'info');
  log(enabled ? 'info' : 'warn', enabled ? 'debug logging on' : 'debug logging off');
}

/** Read the relay socket table from the installed trystero nostr strategy. The table maps a
 * relay URL to the live `WebSocket` for it, so a missing entry means the relay has not been
 * dialled yet, or has been dropped for good. */
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

/** Last state reported for each relay, so a change is logged once instead of on every tick.
 * Trystero retires a relay permanently once its reconnect backoff runs out, so one going from
 * open to closed never comes back this session and is worth saying out loud. */
const lastRelayState = new Map<string, string>();

/** Log a relay transition the first time it is seen. */
function reportRelayChanges(states: Record<string, string>): void {
  for (const [url, state] of Object.entries(states)) {
    if (lastRelayState.get(url) === state) {
      continue;
    }
    lastRelayState.set(url, state);
    if (state === 'closed') {
      note('warn', `relay ${url} closed and will not be retried until reload`);
    } else if (state === 'open') {
      note('info', `relay ${url} is open`);
    } else if (state === 'failed') {
      note('warn', `relay ${url} could not be reached`);
    }
  }
}

function snapshot(label: string, getPeers: () => Record<string, RTCPeerConnection>): void {
  const relays = relayStates();
  const peers = peerStates(getPeers);
  const open = Object.values(relays).filter(state => state === 'open').length;
  note('info', `[${label}] relays open ${open}/${Object.keys(relays).length}`, relays, 'peers', peers);
  reportRelayChanges(relays);
  const peerIds = Object.keys(peers);
  if (peerIds.length === 0) {
    note('info', `[${label}] no peers discovered yet`);
  }
}

/** Log ICE gathering transitions, which is where a blocked network shows up. Candidate types say
 * which of STUN and TURN got through: no srflx means STUN never answered, no relay means TURN
 * was unreachable, and either one looks the same as an ordinary NAT from the state alone. */
function reportIceGathering(getPeers: () => Record<string, RTCPeerConnection>): void {
  for (const [peerId, connection] of Object.entries(getPeers())) {
    connection.addEventListener('icecandidate', (event) => {
      note('info', `candidate for ${peerId}`, event.candidate?.type ?? 'end of candidates');
    });
    connection.addEventListener('icegatheringstatechange', () => {
      note('info', `ice gathering for ${peerId} is ${connection.iceGatheringState}`);
    });
    connection.addEventListener('connectionstatechange', () => {
      note('info', `connection for ${peerId} is ${connection.connectionState}`);
    });
  }
}

/** Start periodic connection logging. All of it is written at `info` so it is visible without
 * any extra flag, since a silent connection is the failure mode that matters most here. */
export function startDiagnostics(getPeers: () => Record<string, RTCPeerConnection>): () => void {
  const build = document.querySelector('script[src*="assets/index-"]')?.getAttribute('src') ?? 'unknown';
  log('info', 'build', build, 'debug', String(isDebugEnabled()));
  log('info', 'href', window.location.href);
  const relays = relayPool();
  log('info', 'relay pool', relays.length, 'first', relays[0] ?? 'none');

  // Trystero reports a relay it has given up on through the console rather than this logger,
  // and those lines are the reason a room would not open, so they join the report too.
  const consoleWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    note('warn', 'trystero', ...args);
    consoleWarn(...args);
  };

  window.addEventListener('error', (event) => {
    note('error', 'uncaught error', event.message, event.filename, event.lineno);
  });
  window.addEventListener('unhandledrejection', (event) => {
    note('error', 'unhandled rejection', String(event.reason));
  });

  const timer = setInterval(() => snapshot('status', getPeers), PollIntervalMs);
  snapshot('initial', getPeers);
  reportIceGathering(getPeers);
  return () => {
    clearInterval(timer);
    console.warn = consoleWarn;
  };
}
