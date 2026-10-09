import { clockStatus } from './Clock';

/** Something about this device that makes a room hard to reach, said only once a wait has proved
 * long. Kept apart from `BlockedReason` because nothing here was sent by the host: it is the
 * browser explaining itself, where a refusal is the room answering. */
export type ConnectionHint = 'noPeers' | 'clockUnchecked';

/** How long a room may take to answer before the client says something about its own device.
 * Slow enough that an ordinary connect is never blamed, short enough that a player is not left
 * staring at a spinner wondering whether they did something wrong. */
export const StallHintMs = 12_000;

/** What this device can say about a wait going on too long. A drifted clock stops a peer hearing
 * anyone while every relay still reports open, which from the outside looks like a bad network,
 * so the clock is named whenever this device could not check its own. */
export function stallHint(): ConnectionHint {
  return clockStatus() === 'failed' ? 'clockUnchecked' : 'noPeers';
}
