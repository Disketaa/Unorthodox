// Post-deploy check for the relay named by VITE_RELAY_URL: subscribe, publish an ephemeral
// Nostr event, and fail unless it comes back. A unit test cannot catch a relay that accepts
// writes but forwards nothing, which is exactly how a live break looks.
//
//   node Tools/RelaySmoke.mjs [wss-url]
//
// Run it after every relay or config change. Exits non-zero on failure.
import { createEvent } from '@trystero-p2p/nostr';

/* global WebSocket, setTimeout */

const url = process.argv[2] ?? process.env.VITE_RELAY_URL;
const WaitMs = 8_000;

if (url === undefined) {
  console.error('no relay url: pass one as an argument or set VITE_RELAY_URL');
  process.exit(2);
}

/** createEvent derives the kind from the topic, and nostr `kinds` is an exact list, so the
 * subscription has to name the same kind the published event will carry. */
const kindOf = topic => [...topic].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 10_000;

async function open(label) {
  const socket = new WebSocket(url);
  const opened = await new Promise(resolve => {
    socket.addEventListener('open', () => resolve(true));
    socket.addEventListener('error', () => resolve(false));
  });
  if (!opened) {
    console.error(`${label}: could not open ${url}`);
    process.exit(1);
  }
  return socket;
}

const topic = `smoke-${Date.now()}`;
const kind = kindOf(topic) + 20_000;
let delivered = 0;

const subscriber = await open('subscriber');
subscriber.addEventListener('message', event => {
  const frame = JSON.parse(String(event.data));
  if (frame[0] === 'EVENT') {
    delivered++;
  }
});
subscriber.send(
  JSON.stringify(['REQ', 'smoke', { kinds: [kind], since: Math.floor(Date.now() / 1000), '#x': [topic] }]),
);

await new Promise(resolve => setTimeout(resolve, 1_500));

const publisher = await open('publisher');
let accepted = false;
publisher.addEventListener('message', event => {
  const frame = JSON.parse(String(event.data));
  if (frame[0] === 'OK') {
    accepted = frame[2] === true;
  }
});
publisher.send(await createEvent(topic, JSON.stringify({ smoke: true, n: Date.now() })));

await new Promise(resolve => setTimeout(resolve, WaitMs));

if (!accepted) {
  console.error('the relay refused the event');
} else if (delivered === 0) {
  console.error(`the relay accepted the event and forwarded nothing (kind ${kind})`);
} else {
  console.log(`relay ok: ${url} accepted and forwarded an ephemeral event`);
}
publisher.close();
subscriber.close();
process.exit(accepted && delivered > 0 ? 0 : 1);
