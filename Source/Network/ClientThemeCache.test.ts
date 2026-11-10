import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { customThemesOf } from './ClientThemeCache';
import { addCustomTheme } from '@/Core';
import type { PublicLobbyState } from '@/Game';
import type { CustomTheme } from '@/Core';

vi.mock('@/Core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/Core')>();
  return {
    ...actual,
    addCustomTheme: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makePublicLobbyState(customThemes: readonly CustomTheme[]): PublicLobbyState {
  return {
    phase: 'Lobby',
    players: [],
    turnPlayerId: null,
    pace: 'Standard',
    themes: [],
    themeMode: 'Random',
    customThemes,
    spent: [],
    paused: false,
  };
}

describe('customThemesOf', () => {
  test('returns empty array for undefined state', () => {
    expect(customThemesOf(undefined)).toEqual([]);
  });

  test('returns empty array for state without customThemes', () => {
    const state: PublicLobbyState = {
      phase: 'Lobby',
      players: [],
      turnPlayerId: null,
      pace: 'Standard',
      themes: [],
      themeMode: 'Random',
      customThemes: [],
      spent: [],
      paused: false,
    };
    expect(customThemesOf(state)).toEqual([]);
  });

  test('returns custom themes and registers each', () => {
    const t1: CustomTheme = { name: 't1', color: 'Yellow', questions: ['q1'] };
    const t2: CustomTheme = { name: 't2', color: 'Rose', questions: ['q2'] };
    const state = makePublicLobbyState([t1, t2]);
    const result = customThemesOf(state);
    expect(result).toHaveLength(2);
    expect(addCustomTheme).toHaveBeenCalledTimes(2);
    expect(addCustomTheme).toHaveBeenCalledWith(t1);
    expect(addCustomTheme).toHaveBeenCalledWith(t2);
  });
});
