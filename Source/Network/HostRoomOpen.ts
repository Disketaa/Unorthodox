/** Opening a room to host it: the state it starts from, the host's own seat in it, and the wire
 * going out. Kept out of `HostSession` so that file is the room's own API and nothing else, and
 * so what a room is opened from is one file's worth of reading. */
import { countBots } from './HostRosterActions';
import { departureOf } from './HostPresence';
import { freshLobby } from './RoomStateStore';
import type { HostRoom } from './HostRoom';
import type { Transport } from './Transport';
import type { PlayerId, PlayerLook, CustomTheme } from '@/Core';
import { savedCustomThemes } from '@/Core';
import type { GameAction, HostState } from '@/Game';

/** What the session hands over to have its room opened: its own way of applying an action, the
 * wire, and a way to report back how many invented players the restored roster already had. */
export interface HostRoomOpener {
  room: HostRoom;
  transport: Transport;
  apply(action: GameAction): void;
  botsRestored(count: number): void;
}

/** The custom themes this browser has pasted, merged into whatever the restored room already
 * held. Nothing to merge is nothing to commit, so the restored state is left as it stands. */
function withSavedThemes(restored: HostState): HostState | undefined {
  const known: readonly CustomTheme[] = [
    ...(restored.customThemes?.values() ?? []),
    ...savedCustomThemes(),
  ];
  if (known.length === 0) return undefined;
  return { ...restored, customThemes: new Map(known.map((theme) => [theme.name, theme])) };
}

export function openHostRoom(
  session: HostRoomOpener,
  roomCode: string,
  hostName: string,
  look: PlayerLook,
  hostId: PlayerId
): void {
  const restored = session.room.open(roomCode) ?? freshLobby();
  session.room.commit(restored);
  // This browser's own custom themes into the room it is hosting: a room only deals out of the
  // themes it holds, so without this the host's pasted themes sat in the grid and never in a bank.
  const merged = withSavedThemes(restored);
  if (merged !== undefined) session.room.commit(merged);
  session.room.roster.addHost(hostId, hostName);
  session.room.roster.restore([...restored.players.entries()]);
  session.apply({ type: 'JOIN', playerId: hostId, name: hostName, look });
  session.botsRestored(countBots(restored));
  session.transport.setPlayerId(hostId);
  session.transport.start(roomCode, hostName, true);
  session.transport.onPeerLeave((peerId) => {
    const departure = departureOf(peerId, session.room.roster);
    if (departure !== undefined) session.apply(departure);
  });
}
