import type { BlockedReason, HostMessage } from './Protocol';

/** What a refusal means to a client, once the host has sent one. A table rather than four cases
 * in the handler, since the refusals differ in two facts. `closes` matters most: a kicked
 * player must not sit listening to a room they were put out of. */
export interface Refusal {
  reason: BlockedReason;
  /** Whether the session stops listening as well as asking. */
  closes: boolean;
  /** How many players the room holds, which only the full-room refusal carries. The host's
   * number rather than one written on the client, so the sentence the player reads quotes the
   * rule that refused them. */
  roomLimit: number;
}

const Refusing: Refusal = { reason: 'NameTaken', closes: false, roomLimit: 0 };

/** The refusal this host message carries, if it carries one at all. Named for the return rather
 * than described: the handler's question is whether a message is a refusal, and a state message
 * or an assigned seat is simply not one. */
export function refusalFor(message: HostMessage): Refusal | undefined {
  switch (message.type) {
    case 'NameRejected':
      return { ...Refusing };
    case 'AlreadyStarted':
      return { reason: 'AlreadyStarted', closes: true, roomLimit: 0 };
    case 'RoomFull':
      return { reason: 'RoomFull', closes: false, roomLimit: message.maxPlayers };
    case 'Kicked':
      return { ...Refusing, reason: 'Kicked', closes: true };
    default:
      return undefined;
  }
}