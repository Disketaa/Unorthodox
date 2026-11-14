import { describe, expect, it } from 'vitest';
import { freshLobbyState, type HostState } from './GameState';
import { reducer } from './Reducer';
import { toPublicState } from './PublicState';

describe('reducer SET_SCORING_MODE action', () => {
  it('changes the lobby scoring rule and sends it to clients', () => {
    const state = reducer(freshLobbyState(), {
      type: 'SET_SCORING_MODE',
      scoringMode: 'Simple',
    });
    expect(state.scoringMode).toBe('Simple');
    expect(toPublicState(state).scoringMode).toBe('Simple');
  });

  it('keeps Smart as the default and ignores changes after the lobby', () => {
    let lobby: HostState = freshLobbyState();
    expect(lobby.scoringMode).toBe('Smart');
    lobby = reducer(lobby, {
      type: 'JOIN',
      playerId: 'p1',
      name: 'One',
      look: { character: 'Butterfly', color: 'Coral' },
    });
    lobby = reducer(lobby, {
      type: 'JOIN',
      playerId: 'p2',
      name: 'Two',
      look: { character: 'Hat', color: 'Violet' },
    });
    const playing = reducer(lobby, { type: 'START_GAME', durationMs: 1, startedAt: 0 });
    expect(reducer(playing, { type: 'SET_SCORING_MODE', scoringMode: 'Simple' })).toBe(playing);
  });
});
