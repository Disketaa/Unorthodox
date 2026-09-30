import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from './InMemoryTransport';
import { HostSession } from './HostSession';
import { ClientSession } from './ClientSession';
import { PlayerLook } from '@/Core';
import { PublicState } from '@/Game';

const roomCode = 'ABCD';
const hostName = 'Host';
const clientNames = ['Alice', 'Bob', 'Charlie'];
const hostLook: PlayerLook = { character: 'Butterfly', color: 'Coral' };
const clientLook: PlayerLook = { character: 'Ghost', color: 'Sky' };
// Distinct enough that the fuzzy grouper keeps them in separate groups.
const answers = ['Answer One', 'Answer Two', 'Answer Three', 'Answer Four'];
// A solo answer is a unique group, worth GameConfig.scoring.uniquePoints.
const soloGroupPoints = 3;

type Fixture = {
  hostSession: HostSession;
  clientSessions: ClientSession[];
};

/** Start the host and three clients, and have everyone join the lobby. */
function joinLobby(): Fixture {
  const hostSession = new HostSession(new InMemoryTransport());
  // The host must register before any client tries to reach it.
  hostSession.start(roomCode, hostName, hostLook);
  const clientSessions = clientNames.map(name => {
    const session = new ClientSession(new InMemoryTransport());
    session.start(roomCode, name);
    session.join(name, clientLook);
    return session;
  });
  return { hostSession, clientSessions };
}

/** Join the lobby, then start a writing round. */
function startRound(): Fixture {
  const fixture = joinLobby();
  fixture.hostSession.startGame('Test topic', 1000);
  return fixture;
}

/** Join the lobby, start a round, and collect one answer per player (host included). */
function playRound(): Fixture {
  const fixture = startRound();
  fixture.clientSessions.forEach((session, index) => {
    session.submitAnswer(answers[index]);
  });
  fixture.hostSession.submitOwnAnswer(answers[3]);
  return fixture;
}

/** Every client's current public state, ignoring any that have none yet. */
function clientStates(fixture: Fixture): PublicState[] {
  return fixture.clientSessions
    .map(session => session.getState())
    .filter((state): state is PublicState => state !== undefined);
}

/** The host's state, narrowed to Writing so topic/submittedCount are readable. */
function hostWriting(fixture: Fixture) {
  const state = fixture.hostSession.getState();
  return state?.phase === 'Writing' ? state : undefined;
}

/** A client's state, narrowed to Writing so topic/submittedCount are readable. */
function clientWriting(session: ClientSession) {
  const state = session.getState();
  return state?.phase === 'Writing' ? state : undefined;
}

function checkPlayerIdsAssigned(fixture: Fixture): void {
  const hostState = fixture.hostSession.getState();
  expect(hostState?.phase).toBe('Lobby');
  // The host plays as well, so the roster is the host plus the three clients.
  expect(hostState?.phase === 'Lobby' && hostState.players.size).toBe(clientNames.length + 1);
  expect(fixture.clientSessions.map(session => session.getPlayerId())).toEqual(['p1', 'p2', 'p3']);
}

function checkWritingState(round: Fixture): void {
  expect(round.hostSession.getState()?.phase).toBe('Writing');
  expect(hostWriting(round)?.topic).toBe('Test topic');
  expect(clientStates(round).every(
    state => state.phase === 'Writing' && state.topic === 'Test topic' && state.submittedCount === 0
  )).toBe(true);
}

function checkAnswersCollected(round: Fixture): void {
  // Each submission is reflected back in the shared submittedCount.
  round.clientSessions.forEach((session, index) => {
    session.submitAnswer(answers[index]);
    expect(clientWriting(session)?.submittedCount).toBe(index + 1);
  });
}

function checkReviewingGroups(round: Fixture): void {
  expect(round.hostSession.getState()?.phase).toBe('Reviewing');
  expect(clientStates(round).every(state =>
    state.phase === 'Reviewing' &&
    state.topic === 'Test topic' &&
    state.groups.length === 4 &&
    state.groups.every(group => group.playerCount === 1)
  )).toBe(true);
}

function checkScores(round: Fixture): void {
  expect(round.hostSession.getState()?.phase).toBe('Scores');
  expect(clientStates(round).every(state =>
    state.phase === 'Scores' &&
    state.scores.length === 4 &&
    state.scores.every(score => score.score === soloGroupPoints)
  )).toBe(true);
}

function checkNextRound(round: Fixture): void {
  expect(hostWriting(round)?.topic).toBe('Test topic 2');
  expect(clientStates(round).every(state =>
    state.phase === 'Writing' && state.topic === 'Test topic 2' && state.submittedCount === 0
  )).toBe(true);
}

describe('InMemoryTransport integration test (host + 3 clients)', function() {
  beforeEach(() => {
    InMemoryTransport.resetPeers();
  });

  afterEach(() => {
    InMemoryTransport.resetPeers();
  });

  it('assigns each joining client a unique player id', function() {
    checkPlayerIdsAssigned(joinLobby());
  });

  it('should start game and set writing state', function() {
    checkWritingState(startRound());
  });

  it('should submit answers and collect them', function() {
    checkAnswersCollected(startRound());
  });

  it('should move to reviewing with one group per distinct answer', function() {
    const round = playRound();
    round.hostSession.endReviewing(1000);
    checkReviewingGroups(round);
  });

  it('should move to scores once reviewing ends', function() {
    const round = playRound();
    round.hostSession.endReviewing(1000);
    round.hostSession.endReviewing(1000);
    checkScores(round);
  });

  it('should go to next round and set writing state for next round', function() {
    const round = playRound();
    round.hostSession.endReviewing(1000);
    round.hostSession.nextRound('Test topic 2', 1000);
    checkNextRound(round);
  });
});
