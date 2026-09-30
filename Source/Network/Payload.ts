import type { JsonValue } from 'trystero';

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
 * Read the host's peerId out of the internal `HostPeerId` announcement.
 * Returns undefined for any other message.
 */
export function readHostPeerId(message: JsonValue): string | undefined {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return undefined;
  }
  const record: Record<string, unknown> = { ...message };
  if (record.type !== 'HostPeerId') {
    return undefined;
  }
  return typeof record.peerId === 'string' ? record.peerId : undefined;
}
