/** Something about this device that makes a room hard to reach, said only once a wait has proved
 * long. Kept apart from `BlockedReason` because nothing here was sent by the host: it is the
 * browser explaining itself, where a refusal is the room answering. */
export type ConnectionHint = 'noPeers' | 'clockUnchecked';

/** How long a room may take to answer before the client says something about its own device.
 * Slow enough that an ordinary connect is never blamed, short enough that a player is not left
 * staring at a spinner wondering whether they did something wrong. */
export const StallHintMs = 12_000;
