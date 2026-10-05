import { PlayerId, PlayerLook, isPlayerLook } from '@/Core';
import * as Game from '@/Game';

/** Messages sent from clients to the host. `groupId` is the numeric index assigned by the
 * grouping algorithm. */
export type ClientMessage =
  | { type: 'Join'; name: string; look: PlayerLook; clientId: string }
  | { type: 'SetLook'; playerId: PlayerId; look: PlayerLook }
  | { type: 'SubmitAnswer'; text: string; playerId: PlayerId }
  | { type: 'RejectGroup'; groupId: number; playerId: PlayerId }
  | { type: 'Sync' };

export type HostMessage =
  | {
      type: 'State';
      state: Game.PublicState;
      /** The host's clock when this was sent. A client uses it to work out the offset between
       * the two clocks, so it can read the phase start time in state and know how much of the
       * phase has already elapsed. */
      hostNow: number;
    }
  | { type: 'SetPlayerId'; playerId: PlayerId }
  | { type: 'NameRejected' }
  | { type: 'AlreadyStarted' }
  | {
      type: 'RoomFull';
      /** How many players the room holds. On the wire rather than written into a sentence: the
       * limit is a number the host holds and the client may not read, so a bare "full" would be
       * a dead end. */
      maxPlayers: number;
    }
  | { type: 'Kicked' };

/** Narrow an unknown value to an indexable record so its fields can be checked. */
function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  return { ...value };
}

/** Why a client is not in a room. All end the same way on screen, so one field with a reason
 * rather than several booleans that could all be set. Here rather than on the session: these
 * are the host's messages first. */
export type BlockedReason = 'NameTaken' | 'AlreadyStarted' | 'RoomFull' | 'Kicked';

export function isClientMessage(value: unknown): value is ClientMessage {
  const record = asRecord(value);
  if (record === undefined) {
    return false;
  }
  switch (record.type) {
    case 'Join':
      return (
        typeof record.name === 'string' &&
        isPlayerLook(record.look) &&
        typeof record.clientId === 'string'
      );
    case 'SetLook':
      return typeof record.playerId === 'string' && isPlayerLook(record.look);
    case 'SubmitAnswer':
      return typeof record.text === 'string' && typeof record.playerId === 'string';
    case 'RejectGroup':
      return typeof record.groupId === 'number' && typeof record.playerId === 'string';
    case 'Sync':
      // A returning client asks the host to resend the current state.
      return true;
    default:
      return false;
  }
}

export function isHostMessage(value: unknown): value is HostMessage {
  const record = asRecord(value);
  if (record === undefined) {
    return false;
  }
  switch (record.type) {
    case 'State':
      // The payload is not walked field by field. A host sending a malformed state has
      // broken its own room, so a client that rejected it would have nothing better to show.
      return 'state' in record;
    case 'SetPlayerId':
      return typeof record.playerId === 'string';
    case 'NameRejected':
      // The host refused this client's join, so it gets no player id and no state.
      return true;
    case 'AlreadyStarted':
      // The room is past its lobby, so this client cannot be in it at all.
      return true;
    case 'RoomFull':
      // The room has every seat it holds. The count is checked because the sentence the
      // client builds says how many, and a host that sent a nonsense one would put a
      // number nobody can act on in front of the player.
      return typeof record.maxPlayers === 'number';
    case 'Kicked':
      // The host removed this player from the room.
      return true;
    default:
      return false;
  }
}
