import { PlayerId, PlayerLook, isPlayerLook } from '@/Core';
import * as Game from '@/Game';

/**
 * Messages sent from clients to the host.
 * `groupId` is the numeric index assigned by the grouping algorithm.
 */
export type ClientMessage =
  | { type: 'Join'; name: string; look: PlayerLook }
  | { type: 'SetLook'; playerId: PlayerId; look: PlayerLook }
  | { type: 'SubmitAnswer'; text: string; playerId: PlayerId }
  | { type: 'RejectGroup'; groupId: number; playerId: PlayerId }
  | { type: 'Sync' };

export type HostMessage =
  | {
      type: 'State';
      state: Game.PublicState;
      /**
       * The host's clock when this was sent. A client uses it to work out the
       * offset between the two clocks, so it can read the phase start time in
       * state and know how much of the phase has already elapsed.
       */
      hostNow: number;
    }
  | { type: 'SetPlayerId'; playerId: PlayerId }
  | { type: 'NameRejected' }
  | { type: 'Kicked' };

/** Narrow an unknown value to an indexable record so its fields can be checked. */
function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  return { ...value };
}

export function isClientMessage(value: unknown): value is ClientMessage {
  const record = asRecord(value);
  if (record === undefined) {
    return false;
  }
  switch (record.type) {
    case 'Join':
      return typeof record.name === 'string' && isPlayerLook(record.look);
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
      // The payload is not walked field by field. It is written by the host rather
      // than by a peer, and a host sending a malformed state has broken its own
      // room, so a client that rejected it would have nothing better to show. The
      // screens read the fields they need and treat a missing one as absent.
      return 'state' in record;
    case 'SetPlayerId':
      return typeof record.playerId === 'string';
    case 'NameRejected':
      // The host refused this client's join, so it gets no player id and no state.
      return true;
    case 'Kicked':
      // The host removed this player from the room.
      return true;
    default:
      return false;
  }
}
