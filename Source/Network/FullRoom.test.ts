/**
 * The browser is the point of this file: a refusal is answered by a message and
 * a retry loop, and neither runs without the timers and storage the environment
 * provides.
 */
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { forgetClientId } from './ClientIdentity';
import { isHostMessage } from './Protocol';
import { GameConfig } from '@/Game';
import type { HostState } from '@/Game';
import type { PlayerLook } from '@/Core';

const roomCode = 'FULL';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };
const Full = () => GameConfig.limits.maxPlayers;

/**
 * A room holding `count` seats before anybody new arrives.
 *
 * The seats are real joins rather than invented ones, because a seat is what
 * the room counts and a roster nobody claimed is not one.
 */
function roomHolding(count: number): HostSession {
  const host = new HostSession(new InMemoryTransport());
  host.start(roomCode, 'Host', hostLook);
  for (let index = 1; index < count; index += 1) {
    join(`Игрок ${index}`);
    vi.advanceTimersByTime(50);
  }
  return host;
}

/** Somebody joining the room, whether for the first time or a second time. */
function join(name: string): ClientSession {
  const client = new ClientSession(new InMemoryTransport());
  client.start(roomCode, name);
  client.join(name, clientLook);
  vi.advanceTimersByTime(200);
  return client;
}

  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
    forgetClientId();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

function seatsIn(host: HostSession): HostState['players'] {
  return host.getState()?.players ?? new Map();
}

describe('a room with no seat left', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
    forgetClientId();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('turns away a seventeenth player rather than seating them', () => {
    const host = roomHolding(Full());
    const late = join('Семнадцатый');

    // The bar of players holds exactly what a room holds, so a seventeenth seat is a
    // player the room cannot show and a score nobody can read.
    expect(late.getBlocked()).toBe('RoomFull');
    expect(seatsIn(host).size).toBe(Full());
  });

  it('seats a player in the last seat the room has', () => {
    const host = roomHolding(Full() - 1);
    const late = join('Шестнадцатый');

    expect(late.getBlocked()).toBeUndefined();
    expect(seatsIn(host).size).toBe(Full());
  });

  it('has room again once somebody leaves', () => {
    const host = roomHolding(Full());
    const leaving = [...seatsIn(host).keys()].find((id) => id !== 'host');
    host.kick(leaving ?? '');

    // The refusal is the room's, so it can be withdrawn: a seat given up is a seat the
    // next arrival can be given.
    expect(join('Семнадцатый').getBlocked()).toBeUndefined();
    expect(seatsIn(host).size).toBe(Full());
  });

  it('lets a player with a seat keep it, even in a room that is full', () => {
    roomHolding(Full());
    const back = join('Игрок 1');

    // A refresh re-asks with the name it already holds, and a room at its limit must not
    // answer that the way it answers a stranger: there is nothing to give this player and
    // so nothing to refuse them.
    expect(back.getBlocked()).toBeUndefined();
    expect(back.getPlayerId()).not.toBeNull();
  });
});

describe('the refusal itself', () => {
  it('says how many players the room holds, rather than the client guessing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      InMemoryTransport.resetPeers();
      forgetClientId();
      localStorage.clear();
    });
    afterEach(() => {
      vi.useRealTimers();
      InMemoryTransport.resetPeers();
    });
    roomHolding(Full());

    expect(join('Семнадцатый').getRoomLimit()).toBe(Full());
  });

  it('stops asking, since the host cannot answer differently while it is full', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      InMemoryTransport.resetPeers();
      forgetClientId();
      localStorage.clear();
    });
    afterEach(() => {
      vi.useRealTimers();
      InMemoryTransport.resetPeers();
    });
    roomHolding(Full());
    const late = join('Семнадцатый');
    vi.advanceTimersByTime(30_000);

    expect(late.getBlocked()).toBe('RoomFull');
  });

  it('is a message a host is allowed to send, with the count it quotes', () => {
    expect(isHostMessage({ type: 'RoomFull', maxPlayers: 16 })).toBe(true);
    // A client that accepted it without a count would build "0 игроков" and put a number
    // in front of the player that no rule in the game could have produced.
    expect(isHostMessage({ type: 'RoomFull' })).toBe(false);
  });
});