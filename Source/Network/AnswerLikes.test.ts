import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { ClientSession } from './ClientSession';
import type { PlayerLook } from '@/Core';
import type { PublicReviewingState } from '@/Game';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** The host and one client, both in, and the round already showing its answers: the host wrote
 * one word and the client another, so each of them has exactly one card they may not like. */
function playingRound(): { hostSession: HostSession; client: ClientSession } {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start('ABCD', 'Host', look);
  const client = new ClientSession(new InMemoryTransport());
  client.start('ABCD', 'Ann');
  client.join('Ann', look);
  hostSession.startGame();
  hostSession.startWriting('Test topic');
  client.submitAnswer('An answer');
  hostSession.submitOwnAnswer('Another answer');
  hostSession.endReviewing(90_000);
  return { hostSession, client };
}

/** What the client is currently shown, as the board of answers with the counts beside it. */
function shownOn(client: ClientSession): PublicReviewingState | undefined {
  const state = client.getState();
  return state?.phase === 'Reviewing' ? state : undefined;
}

/** How many liked each card on the client's screen, by card id. */
function countsOn(client: ClientSession): Record<number, number> {
  const counts = shownOn(client)?.likeCounts ?? [];
  return Object.fromEntries(counts.map((entry) => [entry.groupId, entry.count]));
}

/** The card carrying one word on the client's screen. Looked up by the word rather than by id,
 * because the board is dealt: an id says which answer a card is, never where it came out. */
function cardWith(client: ClientSession, text: string): number {
  const group = shownOn(client)?.groups.find((entry) => entry.text === text);
  if (!group) throw new Error(`no card saying ${text}`);
  return group.groupId;
}

describe('a like over the wire', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('reaches the whole room from any one player', () => {
    // The host's own card is the one card the client may like, so it is the one that proves a
    // client can cast at all and that the count comes back down to everybody.
    const { client } = playingRound();
    client.likeGroup(cardWith(client, 'Another answer'));
    expect(countsOn(client)).toEqual({ [cardWith(client, 'Another answer')]: 1 });
  });

  it('is refused when a client casts it on their own answer', () => {
    // The host is the only one who knows who wrote what, so it is the only one who can refuse.
    // A client is refused here rather than trusted at the screen, since the badge being drawn
    // without a press is a promise the screen makes and the host has to keep.
    const { client } = playingRound();
    client.likeGroup(cardWith(client, 'An answer'));
    expect(countsOn(client)).toEqual({});
  });

  it('leaves the room able to see the board it may not change', () => {
    // Refusing the like is not refusing the player: they still get the board, with everybody
    // else's likes on it, and are still in the round the host is muting in.
    const { client } = playingRound();
    const theirs = cardWith(client, 'Another answer');
    client.likeGroup(theirs);
    client.likeGroup(cardWith(client, 'An answer'));
    expect(countsOn(client)).toEqual({ [theirs]: 1 });
  });

  it('is taken back for everybody on a second press', () => {
    const { client } = playingRound();
    const theirs = cardWith(client, 'Another answer');
    client.likeGroup(theirs);
    expect(countsOn(client)).toEqual({ [theirs]: 1 });
    client.likeGroup(theirs);
    expect(countsOn(client)).toEqual({});
  });

  it('does not change what the round scores', () => {
    // A like is a reaction and not a move: the host's mute is the only thing on this board that
    // takes an answer off it, and this must not quietly become a second one.
    const { hostSession, client } = playingRound();
    client.likeGroup(0);
    hostSession.endReviewing(15_000);
    const scores = hostSession.getState();
    if (scores?.phase !== 'Scores') throw new Error('not scored');
    expect([...scores.scores.values()].every((score) => score > 0)).toBe(true);
  });
});
