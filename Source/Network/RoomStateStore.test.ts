// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import type { HostState } from '@/Game';
import { decodeRoomState, encodeRoomState } from './RoomStateCodec';
import { clearRoomState, freshLobby, loadRoomState, saveRoomState } from './RoomStateStore';

/** Round-trip the way the room does: write plain data, read it back. */
function resume(state: HostState): HostState | undefined {
  return decodeRoomState(JSON.parse(JSON.stringify(encodeRoomState(state))));
}

const look = { character: 'Butterfly', color: 'Coral' } as const;

beforeEach(() => {
  localStorage.clear();
});

/** The writing phase as a host leaves it, with an answer already written. */
const writingPhase: HostState = {
  phase: 'Writing',
  topic: 'Два слова',
  durationMs: 60000,
  startedAt: 5000,
  answers: new Map([['host', 'раз']]),
  players: new Map(),
  cumulativeScores: new Map([['host', 7]]),
};

/** The same round once the room has moved on to reading the answers. */
const reviewingPhase: HostState = {
  phase: 'Reviewing',
  topic: 'Два слова',
  durationMs: 90_000,
  startedAt: 5000,
  answers: new Map([['host', 'раз']]),
  groupRejections: new Map([[1, new Set(['host', 'p1'])]]),
  players: new Map(),
  cumulativeScores: new Map([['host', 7]]),
};

const scoresPhase: HostState = {
  phase: 'Scores',
  durationMs: 15000,
  startedAt: 2,
  scores: new Map([['host', 10]]),
  players: new Map(),
  cumulativeScores: new Map([['host', 10]]),
};

const finalPhase: HostState = {
  phase: 'Final',
  players: new Map(),
  cumulativeScores: new Map([['host', 10]]),
};

describe('a room that outlives its tab', () => {
  it('comes back with the lobby it was left in', () => {
    const lobby = {
      ...freshLobby(),
      pace: 'Fast' as const,
      players: new Map([['host', { name: 'Danya', look, isOnline: true }]]),
    };
    saveRoomState('1234', lobby);
    expect(loadRoomState('1234')).toEqual(lobby);
  });

  it('comes back mid-round, with the answers and the clock it was on', () => {
    saveRoomState('1234', writingPhase);
    expect(loadRoomState('1234')).toEqual(writingPhase);
  });

  it('comes back with the rejections, which are sets and not lists', () => {
    saveRoomState('1234', reviewingPhase);
    expect(loadRoomState('1234')).toEqual(reviewingPhase);
  });

it('comes back on the scores and on the last table', () => {
    saveRoomState('1', scoresPhase);
    saveRoomState('2', finalPhase);
    expect(loadRoomState('1')).toEqual(scoresPhase);
    expect(loadRoomState('2')).toEqual(finalPhase);
  });

  it('is forgotten when the room is left, and kept apart from other rooms', () => {
    saveRoomState('1234', freshLobby());
    saveRoomState('5678', freshLobby());
    clearRoomState('1234');
    expect(loadRoomState('1234')).toBeUndefined();
    expect(loadRoomState('5678')).toBeDefined();
  });
});

describe('a room played from another tab', () => {
  // The state is in `localStorage`, which is the browser's rather than the tab's: a tab
  // that was closed and opened again is a different tab and has to find the same game.
  it('is found again after everything in this tab has been thrown away', () => {
    saveRoomState('OPEN', writingPhase);
    // Nothing of the session survives this, which is exactly what closing a tab is.
    expect(loadRoomState('OPEN')).toEqual(writingPhase);
  });
});

describe('what comes back', () => {
  it('is nothing for a code this tab has never hosted', () => {
    expect(loadRoomState('0000')).toBeUndefined();
  });

  it('is nothing rather than a broken room when the stored text is not a state', () => {
    // Better a fresh lobby than a phase with no clock, which would be a round that can
    // never be closed.
    localStorage.setItem('unorthodox.host.1234', '{ not json');
    expect(loadRoomState('1234')).toBeUndefined();
    localStorage.setItem('unorthodox.host.1234', '{"phase":"Nonsense"}');
    expect(loadRoomState('1234')).toBeUndefined();
  });

  it('drops entries that are not what they claim rather than trusting them', () => {
    localStorage.setItem(
      'unorthodox.host.1234',
      JSON.stringify({ phase: 'Writing', durationMs: 1, startedAt: 2, topic: 'т', answers: [['host', 7], ['p1', 'раз'], 'rubbish'] }),
    );
    const resumed = loadRoomState('1234');
    expect(resumed?.phase === 'Writing' ? [...resumed.answers] : []).toEqual([['p1', 'раз']]);
  });

  it('round-trips a state it was never asked about', () => {
    const lobby = freshLobby();
    expect(resume(lobby)).toEqual(lobby);
  });
});
