import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { ClientSession } from './ClientSession';
import type { PlayerLook } from '@/Core';
import type { PublicReviewingState } from '@/Game';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

/** Rooms are told apart by their code, and the broker behind the test transport is shared by
 * every room in the file, so each room gets one of its own rather than all sharing a code. */
let nextRoom = 0;

function roomCode(): string {
  nextRoom += 1;
  return `ABCD${nextRoom}`;
}

/** The host and one client, both in, and the round already showing its answers so that a mute
 * has something to land on. */
function playingRound(): { hostSession: HostSession; client: ClientSession } {
  const code = roomCode();
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(code, 'Host', look);
  const client = new ClientSession(new InMemoryTransport());
  client.start(code, 'Ann');
  client.join('Ann', look);
  hostSession.startGame();
  hostSession.startWriting('Test topic');
  client.submitAnswer('An answer');
  hostSession.submitOwnAnswer('Another answer');
  // Onto the board. From Writing this is the ordinary close of the round; called again from
  // Reviewing it would score the round instead, which is what `scoredIn` is for.
  hostSession.endReviewing();
  return { hostSession, client };
}

/** What the client is currently shown, as the board of answers with the muted ids beside it. */
function shownOn(client: ClientSession): PublicReviewingState | undefined {
  const state = client.getState();
  return state?.phase === 'Reviewing' ? state : undefined;
}

/** Let the messages in flight arrive. The transport is synchronous; this is here so a change to
 * that shows up as a failing test rather than as a silent pass. */
function settle(): void {
  return undefined;
}

/** Everything a round scored, with the card at `mutedGroupId` muted first if one is named. Run
 * to the end of the review so the totals are the ones the room would be shown. The peers are
 * dropped first, because a room played twice over keeps only the first room's players: the
 * broker the test transport uses is shared by every room in the file, and a second room with a
 * second host finds the first host's seats already claimed. One round, one room. */
function scoredIn(mutedGroupId: number | undefined): number {
  InMemoryTransport.resetPeers();
  const { hostSession } = playingRound();
  if (mutedGroupId !== undefined) {
    hostSession.rejectOwnGroup(mutedGroupId);
  }
  hostSession.endReviewing();
  const scores = hostSession.getState();
  if (scores?.phase !== 'Scores') throw new Error('not scored');
  return [...scores.scores.values()].reduce((sum, score) => sum + score, 0);
}

describe('muting an answer over the wire', () => {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('is the host’s to make, and reaches the client as muted', () => {
    // The host presses a card and the whole room is shown it struck out. One press, one card, one
    // room: this is a judgement the host makes about the board, not a vote the room casts.
    const { hostSession, client } = playingRound();
    settle();
    hostSession.rejectOwnGroup(0);
    settle();
    expect(shownOn(client)?.mutedGroupIds).toEqual([0]);
  });

  it('is refused when a client sends one', () => {
    // A client naming the host on the wire is a client claiming to be the host. The host is the
    // only thing standing between one player's screen and a card struck out for everybody, so it
    // decides whose presses it acts on rather than trusting the id that arrived with them.
    const { hostSession, client } = playingRound();
    settle();
    client.rejectGroup(0);
    settle();
    expect(shownOn(client)?.mutedGroupIds).toBeUndefined();
    const state = hostSession.getState();
    if (state?.phase !== 'Reviewing') throw new Error('not reviewing');
    expect(state.groupRejections.size).toBe(0);
  });

  it('leaves the client able to see the board it is not allowed to change', () => {
    // Refusing the press is not the same as refusing the player: they still get the board, with
    // the host's mutes on it, and are still in the round the host is muting in.
    const { hostSession, client } = playingRound();
    settle();
    hostSession.rejectOwnGroup(0);
    settle();
    client.rejectGroup(1);
    settle();
    expect(shownOn(client)?.groups).toHaveLength(2);
    expect(shownOn(client)?.mutedGroupIds).toEqual([0]);
  });

  it('takes it back for everybody on a second press', () => {
    // A mispress has to be undoable, and undoing it means the room sees the card back: the mute
    // is the room's as soon as it is made, so the taking back is too.
    const { hostSession, client } = playingRound();
    settle();
    hostSession.rejectOwnGroup(0);
    settle();
    hostSession.rejectOwnGroup(0);
    settle();
    expect(shownOn(client)?.mutedGroupIds).toBeUndefined();
  });

  it('is scored as nothing for the players who wrote it, and leaves the rest of the board scoring', () => {
    // Both rounds in one test, in one room each, and the two totals compared. What the muted card
    // loses is the difference between them, so the round has to be the same round apart from the
    // mute: same players, same two answers, one card struck out.
    const withMute = scoredIn(0);
    const withoutMute = scoredIn(undefined);
    expect(withMute).toBeLessThan(withoutMute);
    expect(withMute).toBeGreaterThan(0);
  });
});
