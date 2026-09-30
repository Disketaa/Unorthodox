import { PlayerId } from '@/Core';
import * as Game from '@/Game';

/**
 * Messages sent from clients to the host.
 * `groupId` is the numeric index assigned by the grouping algorithm.
 */
export type ClientMessage =
  | { type: 'Join'; name: string }
  | { type: 'SubmitAnswer'; text: string; playerId: PlayerId }
  | { type: 'RejectGroup'; groupId: number; playerId: PlayerId }
  | { type: 'Sync' };

/**
 * Messages sent from the host to clients.
 */
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
  | { type: 'SetPlayerId'; playerId: PlayerId };

/** Narrow an unknown value to an indexable record so its fields can be checked. */
function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  return { ...value };
}

/**
 * Type guard for ClientMessage.
 */
export function isClientMessage(value: unknown): value is ClientMessage {
  const record = asRecord(value);
  if (record === undefined) {
    return false;
  }
  switch (record.type) {
    case 'Join':
      return typeof record.name === 'string';
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

/**
 * Type guard for HostMessage.
 */
export function isHostMessage(value: unknown): value is HostMessage {
  const record = asRecord(value);
  if (record === undefined) {
    return false;
  }
  switch (record.type) {
    case 'State':
      // We trust that the state is a PublicState (could add more checks if needed)
      return 'state' in record;
    case 'SetPlayerId':
      return typeof record.playerId === 'string';
    default:
      return false;
  }
}
