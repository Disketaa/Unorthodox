import { render } from 'preact';
import { App } from './App';
import { setLogLevel } from '@/Core';
import "@/Design/Tokens/Tokens.css";

/**
 * Debug logging is opt-in via ?debug in the URL, so the noisy connection
 * tracing stays out of the way during normal play but is one keystroke away
 * when a join fails to connect.
 */
if (new URLSearchParams(window.location.search).has('debug')) {
  setLogLevel('debug');
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
render(<App />, root);