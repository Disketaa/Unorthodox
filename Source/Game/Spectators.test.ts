import { describe, expect, it } from 'vitest';
import type { PlayerLook } from '@/Core';
import { reducer } from './Reducer';
import { freshLobbyState, type ReviewingState, type WritingState } from './GameState';
import { boardCardCount, scoreRound, toCardScore } from './RoundScoring';
import { toPublicState } from './PublicState';

const look: PlayerLook = { character: 'Ghost', color: 'Sky' };

function lobby() {
  return reducer(
    reducer(freshLobbyState(), { type: 'JOIN', playerId: 'player', name: 'Player', look }),
    { type: 'JOIN', playerId: 'spectator', name: 'Spectator', look }
  );
}

function spectatorLobby() {
  return reducer(lobby(), {
    type: 'SET_SPECTATOR',
    playerId: 'spectator',
    isSpectator: true,
  });
}

function writing(): WritingState {
  return {
    ...spectatorLobby(),
    phase: 'Writing',
    topic: 'Topic',
    durationMs: 1000,
    startedAt: 0,
    answers: new Map(),
    answerShares: new Map(),
    editing: new Set(),
    theme: undefined,
  };
}

function reviewing(): ReviewingState {
  return {
    ...writing(),
    phase: 'Reviewing',
    answers: new Map([
      ['player', 'Answer'],
      ['spectator', 'Ignored'],
    ]),
    groupRejections: new Map(),
    groupLikes: new Map(),
  };
}

describe('spectator roster state', () => {
  it('defaults a joined player to participating and preserves spectator status on reconnect', () => {
    const spectating = spectatorLobby();
    const rejoined = reducer(spectating, {
      type: 'JOIN',
      playerId: 'spectator',
      name: 'Changed',
      look,
    });
    expect(lobby().players.get('player')?.isSpectator).toBe(false);
    expect(rejoined.players.get('spectator')?.isSpectator).toBe(true);
  });

  it('changes spectator status only in the lobby and projects it publicly', () => {
    const spectating = spectatorLobby();
    expect(
      toPublicState(spectating).players.find(({ id }) => id === 'spectator')?.isSpectator
    ).toBe(true);
    expect(
      reducer(writing(), {
        type: 'SET_SPECTATOR',
        playerId: 'spectator',
        isSpectator: false,
      })
    ).toEqual(writing());
  });

  it('does not start with spectators alone', () => {
    const onlySpectator = reducer(
      reducer(freshLobbyState(), { type: 'JOIN', playerId: 'spectator', name: 'S', look }),
      { type: 'SET_SPECTATOR', playerId: 'spectator', isSpectator: true }
    );
    expect(reducer(onlySpectator, { type: 'START_GAME', durationMs: 1000, startedAt: 0 })).toBe(
      onlySpectator
    );
  });
});

describe('spectator actions', () => {
  it('skips spectators for turns and theme choice', () => {
    const started = reducer(spectatorLobby(), {
      type: 'START_GAME',
      durationMs: 1000,
      startedAt: 0,
    });
    expect(started.turnPlayerId).toBe('player');
    expect(
      reducer(started, {
        type: 'CHOOSE_THEME',
        playerId: 'spectator',
        theme: 'Nature',
        at: 1,
      })
    ).toBe(started);
    expect(reducer(started, { type: 'NEXT_TURN' }).turnPlayerId).toBe('player');
  });

  it('refuses spectator submissions and edits', () => {
    const submitted = reducer(writing(), {
      type: 'SUBMIT_ANSWER',
      playerId: 'spectator',
      text: 'Answer',
      at: 100,
    });
    expect(submitted.phase === 'Writing' && submitted.answers.has('spectator')).toBe(false);
    const withOldAnswer = { ...writing(), answers: new Map([['spectator', 'Old']]) };
    expect(
      reducer(withOldAnswer, {
        type: 'EDITING_ANSWER',
        playerId: 'spectator',
        editing: true,
      })
    ).toBe(withOldAnswer);
  });

  it('refuses spectator likes without changing host rejection handling', () => {
    const state = reviewing();
    expect(reducer(state, { type: 'LIKE_GROUP', playerId: 'spectator', groupId: 0 })).toBe(
      state
    );
    const rejected = reducer(state, {
      type: 'REJECT_GROUP',
      playerId: 'spectator',
      groupId: 0,
    });
    expect(rejected.phase === 'Reviewing' && rejected.groupRejections.has(0)).toBe(true);
  });
});

describe('spectators in public boards and scoring', () => {
  it('excludes spectator answers from writing counts and review cards', () => {
    const state = reviewing();
    const writingState: WritingState = { ...writing(), answers: state.answers };
    const publicWriting = toPublicState(writingState);
    const publicReview = toPublicState(state);
    expect(publicWriting.phase === 'Writing' && publicWriting.submittedIds).toEqual(['player']);
    expect(publicWriting.phase === 'Writing' && publicWriting.submittedCount).toBe(1);
    expect(publicReview.phase === 'Reviewing' && publicReview.groups).toHaveLength(1);
    expect(publicReview.phase === 'Reviewing' && publicReview.groups[0]?.playerIds).toEqual([
      'player',
    ]);
  });

  it('does not put spectators on the blank card or count them as score cards', () => {
    const state = { ...reviewing(), answers: new Map() };
    const publicState = toPublicState(state);
    expect(publicState.phase === 'Reviewing' && publicState.groups[0]?.playerIds).toEqual([
      'player',
    ]);
    expect(boardCardCount(state)).toBe(1);
  });

  it('excludes spectators from Simple player count and round scores', () => {
    const state = reviewing();
    expect(toCardScore(state, { groupId: 0, playerIds: ['player'] }).playerCount).toBe(1);
    const scored = scoreRound(state);
    expect(scored.roundScores.has('spectator')).toBe(false);
  });
});
