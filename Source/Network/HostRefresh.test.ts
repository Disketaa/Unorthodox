/**
 * A refresh is defined by the browser's own storage surviving it, so the
 * environment is the point of this file: without a `localStorage` there is
 * nothing for the host's game to come back in.
 */
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { PlayerLook } from '@/Core';

const roomCode = 'WXYZ';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** A host that has opened the room and started a round in it. */
function hostInRound(): HostSession {
  const host = new HostSession(new InMemoryTransport());
  host.start(roomCode, 'Danya', hostLook);
  host.startGame('Два слова', 60_000);
  host.submitOwnAnswer('два слова');
  return host;
}

/**
 * The host comes back, which is what a browser refresh amounts to.
 *
 * A new session on the same code and the same storage, with nothing carried
 * over in memory: this is the whole difference between the two, and it is the
 * difference between a game continuing and a new room with the same name.
 */
function hostReturns(): HostSession {
  const back = new HostSession(new InMemoryTransport());
  back.start(roomCode, 'Danya', hostLook);
  return back;
}

describe('a host who refreshes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('comes back into the round rather than into a new lobby', () => {
    hostInRound();
    const back = hostReturns();
    const state = back.getState();
    expect(state?.phase).toBe('Writing');
    // The room has to be the same round, not a round of the same name: the topic and
    // the answer already written are what the players are waiting on.
    expect(state?.phase === 'Writing' ? state.topic : '').toBe('Два слова');
    expect(state?.phase === 'Writing' ? [...state.answers] : []).toEqual([['host', 'два слова']]);
  });

  it('comes back still counting the phase from when the room started it', () => {
    hostInRound();
    const back = hostReturns();
    const state = back.getState();
    // A resumed phase whose clock started again would give every player the whole
    // duration again and close the round before anybody answered.
    expect(state?.phase === 'Writing' ? state.durationMs : 0).toBe(60_000);
  });

  it('is a new room when the code has never been hosted here', () => {
    const host = new HostSession(new InMemoryTransport());
    host.start('NEW1', 'Danya', hostLook);
    expect(host.getState()?.phase).toBe('Lobby');
  });
});

describe('a host who leaves rather than refreshes', () => {
  it('forgets the game, so the same code is a new room', () => {
    const host = hostInRound();
    host.stop();
    // Leaving is not refreshing: opening the same code again is a new room, and must
    // not find the old round waiting under the same code.
    expect(hostReturns().getState()?.phase).toBe('Lobby');
  });

  it('gives the next bot a seat that no bot in the resumed room is using', () => {
    const host = new HostSession(new InMemoryTransport());
    host.start(roomCode, 'Danya', hostLook);
    host.addBot();
    host.addBot();
    // The counter that numbers bots lives in the tab, so it comes back at zero: the
    // room is what says how many bots it already has.
    const back = hostReturns();
    back.addBot();
    const state = back.getState();
    const seats = state?.phase === 'Lobby' ? [...state.players.keys()] : [];
    expect(seats.filter((seat) => seat.startsWith('bot'))).toHaveLength(3);
    expect(new Set(seats).size).toBe(seats.length);
  });
});
