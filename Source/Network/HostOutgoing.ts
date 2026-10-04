import * as Game from '@/Game';
import { createLogger } from '@/Core';
import type { Transport } from './Transport';

const log = createLogger('HostOutgoing');

/**
 * The room's public state, sent to everybody.
 *
 * Lifted out of `HostSession` because what leaves the host is not the host's
 * state: it is the room's, with the answers taken out, and that translation is
 * a rule about the wire.
 */
export function publishPublicState(state: Game.HostState, transport: Transport): void {
  const publicState = Game.toPublicState(state);
  log('debug', 'broadcasting', publicState.phase);
  transport.broadcast({ type: 'State', state: publicState, hostNow: Date.now() });
}
