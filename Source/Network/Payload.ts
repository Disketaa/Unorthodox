import type { JsonValue } from 'trystero';

/** Signaling relays used for matchmaking; only one needs to be reachable. */
export const RelayUrls = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://nostr.mom',
  'wss://relay.snort.social',
];

/**
 * Best-effort label for a protocol message, used only in log lines. Falls back
 * to the primitive type for anything that is not a tagged protocol message.
 */
export function describeMessage(message: unknown): string {
  if (typeof message === 'object' && message !== null && 'type' in message) {
    const type = Reflect.get(message, 'type');
    return typeof type === 'string' ? type : 'unknown';
  }
  return typeof message;
}

/**
 * Trystero can only carry structured-clone/JSON payloads. Protocol messages are
 * plain JSON objects, so anything else is rejected rather than sent blindly.
 */
export function toPayload(message: unknown): JsonValue | undefined {
  if (typeof message === 'string' || typeof message === 'number' || typeof message === 'boolean') {
    return message;
  }
  if (message === null || Array.isArray(message) || typeof message === 'object') {
    return { ...message };
  }
  return undefined;
}

/**
 * Prepare a message for the wire, returning undefined when it cannot be sent.
 *
 * Trystero only carries structured-clone/JSON payloads. Rejecting anything else
 * here means a bad message is dropped once, with a reason, instead of failing
 * deep inside the library.
 */
export function preparePayload(
  message: unknown,
  context: string,
  onDrop: (reason: string, message: unknown) => void,
): JsonValue | undefined {
  const payload = toPayload(message);
  if (payload === undefined) {
    onDrop(`${context}: unserialisable payload, dropping`, message);
  }
  return payload;
}

/** Read a `type` tag off a decoded message without casting it. */export function readTag(message: JsonValue): string | undefined {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return undefined;
  }
  const type = Reflect.get(message, 'type');
  return typeof type === 'string' ? type : undefined;
}

/** Read a `role` field off a decoded message without casting it. */
export function readRole(message: JsonValue): string | undefined {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return undefined;
  }
  const role = Reflect.get(message, 'role');
  return typeof role === 'string' ? role : undefined;
}
