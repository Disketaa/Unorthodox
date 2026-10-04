import { wireRoom } from './TrysteroRoom';
import type { RoomActions } from './TrysteroRoom';
import type { JsonValue, MessageAction, MessageContext } from 'trystero';

/** A recorded send, reduced to what the handshake tests care about. */
type Sent = { data: JsonValue; target?: string };

/** A stand-in for a trystero action. It records what was sent and lets a test deliver an incoming message, standing in for the remote side of the wire. */
class FakeAction {
  readonly sent: Sent[] = [];
  onMessage: ((data: JsonValue, context: MessageContext) => void) | null = null;

  send = (data: JsonValue, options?: { target?: string | string[] | null }): Promise<void> => {
    const target = options?.target;
    this.sent.push(typeof target === 'string' ? { data, target } : { data });
    return Promise.resolve();
  };
}

/** Bridge a fake onto the action shape the room code is typed against. */
function asAction(fake: FakeAction): MessageAction<JsonValue> {
  return {
    onReceiveProgress: null,
    send: (data, options) => fake.send(data, { target: options?.target }),
    get onMessage() {
      return fake.onMessage;
    },
    set onMessage(handler) {
      fake.onMessage = handler;
    },
  };
}

type FakeRoom = {
  onPeerJoin?: (peerId: string) => void;
  onPeerLeave?: (peerId: string) => void;
};

/** A message the room reported as arriving. */
type Received = { message: JsonValue; fromHost: boolean; peerId: string };

/**
 * Build a room for a host or a client.
 *
 * Both protocol channels are always created, matching the real transport, and wiring is
 * deferred so a test can inspect what got subscribed.
 */
export function setup(isHost: boolean) {  const room: FakeRoom = {};
  const hostToClient = new FakeAction();
  const clientToHost = new FakeAction();
  const hello = new FakeAction();
  const actions: RoomActions = {
    hostToClient: asAction(hostToClient),
    clientToHost: asAction(clientToHost),
    hello: asAction(hello),
  };
  const received: Received[] = [];
  const hostReadyCalls: number[] = [];
  const handlers = {
    onMessage: (message: JsonValue, fromHost: boolean, peerId: string) => {
      received.push({ message, fromHost, peerId });
    },
    onPeerLeave: () => undefined,
    onHostReady: () => hostReadyCalls.push(1),
  };
  const wire = () => wireRoom(room, actions, isHost, handlers);
  const hostPeer = wire();
  return {
    room,
    hostToClient,
    clientToHost,
    hello,
    actions,
    received,
    hostReadyCalls,
    hostPeer,
    rewire: wire,
  };
}

/** Deliver a message as if it arrived from `peerId`. */
export function deliverTo(action: FakeAction, peerId: string, data: JsonValue): void {
  action.onMessage?.(data, { peerId });
}