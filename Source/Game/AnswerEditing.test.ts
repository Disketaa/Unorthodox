import { describe, test, expect } from 'vitest';
import { handleEditingAnswer } from './AnswerEditing';
import { freshLobbyState } from './GameState';
import type { HostState, WritingState } from './GameState';

function writingState(
  answers: Map<string, string>,
  editing: Set<string> | undefined
): WritingState {
  return {
    ...freshLobbyState(),
    phase: 'Writing',
    topic: 'topic',
    durationMs: 60000,
    startedAt: 0,
    answers,
    editing,
    theme: 'theme',
  } satisfies WritingState;
}

function editingOf(state: HostState): Set<string> | undefined {
  if (state.phase === 'Writing') {
    return state.editing;
  }
  return undefined;
}

describe('handleEditingAnswer', () => {
  test('returns state unchanged when not in Writing phase', () => {
    const state = freshLobbyState();
    const result = handleEditingAnswer(state, {
      type: 'EDITING_ANSWER',
      playerId: 'p1',
      editing: true,
    });
    expect(result).toBe(state);
  });

  test('returns state unchanged when player has no answer', () => {
    const state = writingState(new Map(), undefined);
    const result = handleEditingAnswer(state, {
      type: 'EDITING_ANSWER',
      playerId: 'p1',
      editing: true,
    });
    expect(result).toBe(state);
  });

  test('adds player to editing set when editing starts', () => {
    const answers = new Map([['p1', 'answer']]);
    const state = writingState(answers, undefined);
    const result = handleEditingAnswer(state, {
      type: 'EDITING_ANSWER',
      playerId: 'p1',
      editing: true,
    });
    expect(editingOf(result)).toEqual(new Set(['p1']));
  });

  test('removes player from editing set when editing stops', () => {
    const answers = new Map([['p1', 'answer']]);
    const state = writingState(answers, new Set(['p1']));
    const result = handleEditingAnswer(state, {
      type: 'EDITING_ANSWER',
      playerId: 'p1',
      editing: false,
    });
    expect(editingOf(result)).toEqual(new Set());
  });

  test('keeps other players in editing set', () => {
    const answers = new Map([
      ['p1', 'a'],
      ['p2', 'b'],
    ]);
    const state = writingState(answers, new Set(['p1', 'p2']));
    const result = handleEditingAnswer(state, {
      type: 'EDITING_ANSWER',
      playerId: 'p1',
      editing: false,
    });
    expect(editingOf(result)).toEqual(new Set(['p2']));
  });

  test('does not mutate the original state', () => {
    const answers = new Map([['p1', 'answer']]);
    const state = writingState(answers, undefined);
    const before = state.editing;
    handleEditingAnswer(state, {
      type: 'EDITING_ANSWER',
      playerId: 'p1',
      editing: true,
    });
    expect(state.editing).toBe(before);
  });
});
