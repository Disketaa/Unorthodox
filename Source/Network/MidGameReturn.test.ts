/** The browser is the point of this file: a refresh is defined by the storage behind it surviving, and without a `localStorage` there is nothing for the browser id to come back in. */
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { forgetClientId } from './ClientIdentity';
import { PlayerLook } from '@/Core';
import type { HostState } from '@/Game';

const roomCode = 'RTRY';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

/**
 * A room one round in, with Ann in it.
 *
 * The start is what makes this file different from `ReturningPlayer.test.ts`: the room has left
 * the lobby, so every decision about who may be in it is made from the seats rather than from
 * the phase.
 */
function roomOneRoundIn(): HostSession {
  const host = new HostSession(new InMemoryTransport());
  host.start(roomCode, 'Host', hostLook);
  const ann = new ClientSession(new InMemoryTransport());
  ann.start(roomCode, 'Ann');
  ann.join('Ann', clientLook);
  vi.advanceTimersByTime(1_000);
  host.startGame('Два слова', 60_000);
  return host;
}

/** Ann's tab is closed and opened again, which is a refresh. */
function annReturns(): ClientSession {
  const back = new ClientSession(new InMemoryTransport());
  back.start(roomCode, 'Ann');
  back.join('Ann', clientLook);
  vi.advanceTimersByTime(1_000);
  return back;
}

/** A player who was never in this room at all. */
function strangerArrives(): ClientSession {
  const stranger = new ClientSession(new InMemoryTransport());
  stranger.start(roomCode, 'Гость');
  stranger.join('Гость', clientLook);
  vi.advanceTimersByTime(1_000);
  return stranger;
}

function playersIn(host: HostSession): HostState['players'] {
  const state = host.getState();
  return state?.players ?? new Map();
}

describe('a player who refreshes mid-round', () => {
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

  it('is let back in rather than told the game has started', () => {
    const host = roomOneRoundIn();
    const back = annReturns();

    // The refusal was right for a stranger and wrong for this player, and the difference
    // is a seat: they are already in the room and only their connection left.
    expect(back.getBlocked()).toBeUndefined();
    expect(back.getPlayerId()).not.toBeNull();
    expect(playersIn(host).size).toBe(2);
  });

  it('keeps their seat, their character and their score', () => {
    const host = roomOneRoundIn();
    const before = annReturns().getPlayerId();
    const after = annReturns().getPlayerId();

    expect(after).toBe(before);
    expect(playersIn(host).get(before ?? '')?.look).toEqual(clientLook);
  });

  it('counts as present again, so the round is waited on', () => {
    const host = roomOneRoundIn();
    annReturns();

    // Without this the room would close the round without them and score a player the
    // bar was still showing as present.
    const state = host.getState();
    const online = [...playersIn(host).values()].filter((player) => player.isOnline);
    expect(state?.phase).toBe('Writing');
    expect(online).toHaveLength(2);
  });

  it('still turns away somebody who was never in the room', () => {
    roomOneRoundIn();
    // Otherwise a room in progress would acquire players whose answers the round would
    // then be waiting for, and nobody in it ever saw them arrive.
    expect(strangerArrives().getBlocked()).toBe('AlreadyStarted');
  });
});

describe('a host who refreshes mid-round', () => {
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

  it('comes back with the seats as well as the round', () => {
    roomOneRoundIn();
    const back = new HostSession(new InMemoryTransport());
    back.start(roomCode, 'Host', hostLook);

    // A resumed room with faces and no seats behind them is a room that cannot say who
    // is in it, and a returning player would be a stranger to it.
    expect(back.getState()?.phase).toBe('Writing');
    expect(playersIn(back).size).toBe(2);
  });

  it('lets the player who refreshes back into the resumed room', () => {
    roomOneRoundIn();
    const back = new HostSession(new InMemoryTransport());
    back.start(roomCode, 'Host', hostLook);
    const ann = annReturns();

    expect(ann.getBlocked()).toBeUndefined();
  });

  it('counts the bots it came back with, so the next seat is a free one', () => {
    const host = new HostSession(new InMemoryTransport());
    host.start(roomCode, 'Host', hostLook);
    const ann = new ClientSession(new InMemoryTransport());
    ann.start(roomCode, 'Ann');
    ann.join('Ann', clientLook);
    vi.advanceTimersByTime(1_000);
    host.addBot();
    host.startGame('Два слова', 60_000);

    const back = new HostSession(new InMemoryTransport());
    back.start(roomCode, 'Host', hostLook);
    // The seat a bot sits in is counted out of the room rather than remembered in a
    // counter the tab took with it, so a resumed room hands the next bot a free seat.
    expect([...playersIn(back).keys()].filter((id) => id.startsWith('bot'))).toHaveLength(1);
    expect(playersIn(back).size).toBe(3);
  });
});