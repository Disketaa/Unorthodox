import { render } from 'preact';
import { App } from './App';
import { setLogLevel } from '@/Core';
import { isDebugEnabled } from '@/Network/Diagnostics';
import "@/Design/Tokens/Tokens.css";
import "@/Design/Reset.css";

/**
 * Debug logging is opt-in via ?debug, so the noisy connection tracing stays out
 * of the way during normal play. The flag is read from the query string, from
 * the hash and from localStorage, so it works wherever the ?debug ended up.
 */
if (isDebugEnabled()) {
  setLogLevel('debug');
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
render(<App />, root);