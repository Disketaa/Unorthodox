import { render } from 'preact';
import { App } from './App';
import { setLogLevel } from '@/Core';
import { isDebugEnabled } from '@/Network/Diagnostics';
import { preloadSounds } from '@/Design/Sounds';
import { pruneStrayPath } from './Routes';
import "@/Design/Tokens/Tokens.css";
import "@/Design/Reset.css";

/** Run before the first render, so the router reads a URL that has already been cleaned of a
 * path pasted in by hand, which no route could ever have produced. */
pruneStrayPath();

/** Decoded before anyone presses anything, so the first click is not waiting on a fetch. The
 * context opens suspended, which is why this can run here at all. */
void preloadSounds();

/** Debug logging is opt-in via ?debug, so the noisy connection tracing stays out of the way
 * during normal play. The flag is read from the query string, from the hash and from
 * localStorage, so it works wherever the ?debug ended up. */
if (isDebugEnabled()) {
  setLogLevel('debug');
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
render(<App />, root);
