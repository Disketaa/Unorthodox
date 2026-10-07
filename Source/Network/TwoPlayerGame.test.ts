import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { ClientSession } from './ClientSession';
import { HostSession } from './HostSession';
import { PlayerLook } from '@/Core';
import { GameConfig } from '@/Game';

const roomCode = 'ABCD';
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };

type Fixture = {
  hostSession: HostSession;
  clientSession: ClientSession;
};

/** Start a room with one host and one client, which is the new minimum. */
function startTwoPlayerRoom(): Fixture {
  const hostSession = new HostSession(new InMemoryTransport());
  hostSession.start(roomCode, 'Host', hostLook);
  const clientSession = new ClientSession(new InMemoryTransport());
  clientSession.start(roomCode, 'Ann');
  clientSession.join('Ann', clientLook);
  return { hostSession, clientSession };
}

describe('Two player game', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('allows a minimum of two players', () => {
    expect(GameConfig.limits.minPlayers).toBe(2);
  });

  it('counts the host as a player, so a solo room is one short', () => {
    const { hostSession } = startTwoPlayerRoom();
    const state = hostSession.getState();
    expect(state !== undefined && 'players' in state ? state.players.size : -1).toBe(2);
  });
});

describe('Two player round', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('plays a full round with just two players', () => {
    const { hostSession, clientSession } = startTwoPlayerRoom();
    expect(clientSession.getPlayerId()).not.toBeNull();

    hostSession.startGame();
    hostSession.startWriting('A topic');
    clientSession.submitAnswer('Something blue');
    hostSession.submitOwnAnswer('Something green');

    // The host only leaves the writing phase once everyone has answered.
    hostSession.endReviewing(90_000);
    expect(hostSession.getState()?.phase).toBe('Reviewing');

    // Two distinct answers make two groups, and a review can end.
    hostSession.endReviewing(15_000);
    expect(hostSession.getState()?.phase).toBe('Scores');
  });
});

describe('Two player scoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('scores a pair higher than a solo answer', () => {
    const { hostSession, clientSession } = startTwoPlayerRoom();
    hostSession.startGame();
    hostSession.startWriting('A topic');
    // Matching answers put both players in one group of two.
    clientSession.submitAnswer('The same thing');
    hostSession.submitOwnAnswer('the same thing!');
    hostSession.endReviewing(90_000);
    hostSession.endReviewing(15_000);

    const state = hostSession.getState();
    const scores = state !== undefined && 'scores' in state ? state.scores : new Map();
    expect(scores.size).toBe(2);
    for (const score of scores.values()) {
      expect(score).toBe(GameConfig.scoring.pairPoints);
    }
  });
});

describe('a theme the whole room is told about', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    vi.useRealTimers();
    InMemoryTransport.resetPeers();
  });

  it('reaches the client that did not press it', () => {
    const { hostSession, clientSession } = startTwoPlayerRoom();
    hostSession.startGame();
    hostSession.chooseTheme('Nature');

    // The expanding card is drawn from this, so a pick only counts if the other browser in the
    // room was told about it. A pick held on the presser's own screen is a private decision.
    const state = clientSession.getState();
    expect(state !== undefined && 'theme' in state ? state.theme : undefined).toBe('Nature');
  });

  it('refuses a press from the player who is not on turn', () => {
    const { hostSession, clientSession } = startTwoPlayerRoom();
    // The turn is on the host as the game starts, so Ann pressing every card in the bank
    // changes nothing: the muted cards are a promise the host keeps, not one the client does.
    hostSession.startGame();
    clientSession.chooseTheme('Nature');
    const state = clientSession.getState();
    expect(state !== undefined && 'theme' in state ? state.theme : undefined).toBeUndefined();
  });

  it('takes a press from the client once the turn reaches them', () => {
    const { hostSession, clientSession } = startTwoPlayerRoom();
    hostSession.startGame();
    hostSession.nextTurn();
    clientSession.chooseTheme('Nature');
    const state = clientSession.getState();
    expect(state !== undefined && 'theme' in state ? state.theme : undefined).toBe('Nature');
  });
});
