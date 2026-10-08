import { createLogger, setLogLevel } from '@/Core';
import { relayPool } from './Signaling';
import { fold, note, reportLine } from './Report';
import { reportClockSkew, reportIceGathering } from './PeerWatch';
import { getRelaySockets } from 'trystero';

const log = createLogger('Diagnostics');

/** How often the connection snapshot is written to the console. */
const PollIntervalMs = 3_000;

/** What the host toggled in the lobby, which beats the flags below: a link may carry ?debug and
 * the host may still want it off, and back the other way. Null until someone actually toggles,
 * so an untouched session reads its own flags. */
let override: boolean | null = null;

/** The key the host's choice is kept under. Written either way, so a browser that remembers
 * "off" is not dragged back on by a `?debug` link somebody pastes in, and one that remembers
 * "on" does not have to be asked again each reload. */
const DebugKey = 'debug';

/** What the browser remembers about the flag, or undefined where it remembers nothing. A stored
 * "off" counts: the key existing at all used to mean "on", so anything else is read as on. */
function storedDebug(): boolean | undefined {
  try {
    const value = localStorage.getItem(DebugKey);
    if (value === null) return undefined;
    return value === 'off' || value === '0' ? false : true;
  } catch {
    // Storage may be unavailable; fall through to the URL checks.
    return undefined;
  }
}

/** True when debug output was requested. The flag is accepted in the query string, anywhere in
 * the hash, or in localStorage, so that it survives every shape of link the app produces. */
export function isDebugEnabled(): boolean {
  if (override !== null) {
    return override;
  }
  const stored = storedDebug();
  if (stored !== undefined) {
    return stored;
  }
  return (
    new URLSearchParams(window.location.search).has('debug') ||
    new URLSearchParams(window.location.hash.split('?')[1] ?? '').has('debug')
  );
}

/** Turn debug logging on or off, and leave it that way. Kept in this module's memory as well as
 * written to storage, since the log level has to follow the choice now and not on a later read. */
export function setDebugEnabled(enabled: boolean): void {
  override = enabled;
  try {
    localStorage.setItem(DebugKey, enabled ? 'on' : 'off');
  } catch {
    // A browser refusing storage keeps the choice for this session rather than losing the dock.
  }
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
  const open = Object.values(relays).filter((state) => state === 'open').length;
  note(
    'info',
    `[${label}] relays open ${open}/${Object.keys(relays).length}`,
    relays,
    'peers',
    peers
  );
  reportRelayChanges(relays);
  const peerIds = Object.keys(peers);
  if (peerIds.length === 0) {
    note('info', `[${label}] no peers discovered yet`);
  }
}

/** Start periodic connection logging. All of it is written at `info` so it is visible without
 * any extra flag, since a silent connection is the failure mode that matters most here. */
export function startDiagnostics(
  getPeers: () => Record<string, RTCPeerConnection>
): () => void {
  // Applied from the flag rather than from the last toggle, so a browser that remembered the dock
  // being on also gets its debug lines again. Nothing is written for the off case: info is where
  // the level starts anyway, and a browser refusing storage never asked.
  if (isDebugEnabled()) {
    setLogLevel('debug');
  }
  const build =
    document.querySelector('script[src*="assets/index-"]')?.getAttribute('src') ?? 'unknown';
  log('info', 'build', build, 'debug', String(isDebugEnabled()));
  log('info', 'href', window.location.href);
  const relays = relayPool();
  log('info', 'relay pool', relays.length, 'first', relays[0] ?? 'none');

  // Trystero announces a relay it has given up on through the console, and those lines are why
  // a room would not open. The logger writes through the console too, so the copy goes straight
  // into the report and only the original call is passed on; logging here would recurse.
  const consoleWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const { stamp, body } = reportLine('warn', 'trystero', args);
    fold(stamp, body);
    consoleWarn(...args);
  };

  window.addEventListener('error', (event) => {
    note('error', 'uncaught error', event.message, event.filename, event.lineno);
  });
  window.addEventListener('unhandledrejection', (event) => {
    note('error', 'unhandled rejection', String(event.reason));
  });

  const timer = setInterval(() => {
    snapshot('status', getPeers);
    reportIceGathering(getPeers);
  }, PollIntervalMs);
  snapshot('initial', getPeers);
  reportIceGathering(getPeers);
  void reportClockSkew();
  return () => {
    clearInterval(timer);
    console.warn = consoleWarn;
  };
}
