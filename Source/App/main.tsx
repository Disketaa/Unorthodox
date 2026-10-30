import { render } from 'preact';
import { App } from './App';
import { setLogLevel } from '@/Core';
import { isDebugEnabled } from '@/Network/Diagnostics';
import { syncClockFromServer } from '@/Network/Clock';
import { preloadSounds } from '@/Design/Sounds';
import { preloadMusic } from '@/Design/Music';
import { pruneStrayPath } from './Routes';
import { installPerfInstrumentation } from './PerfInstrumentation';
import '@/Design/Tokens.css';
import '@/Design/Reset.css';

/** Run before the first render, so the router reads a URL that has already been cleaned of a
 * path pasted in by hand, which no route could ever have produced. */
pruneStrayPath();

/** Measured here rather than on entering a room, because the correction shifts every timestamp
 * taken afterwards. Doing it at page load puts it seconds before a player types a room code;
 * doing it at the door would shift the clock out from under a room already running its phases. */
void syncClockFromServer();

/** Decoded before anyone presses anything, so the first click is not waiting on a fetch. The
 * context opens suspended, which is why this can run here at all. */
void preloadSounds();

/** The same bargain for the tracks: three megabytes of music is worth having in memory before
 * anyone reaches a room, and nothing plays until a gesture wakes the context anyway. */
void preloadMusic();

/** Debug logging is opt-in via ?debug, so the noisy connection tracing stays out of the way
 * during normal play. The flag is read from the query string, from the hash and from
 * localStorage, so it works wherever the ?debug ended up. */
if (isDebugEnabled()) {
  setLogLevel('debug');
}

if (import.meta.env.DEV || isDebugEnabled()) {
  installPerfInstrumentation();
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
render(<App />, root);
