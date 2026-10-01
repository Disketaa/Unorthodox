import { describe, it, expect } from 'vitest';
import { botJoin } from './Bot';
import { createRandom } from '@/Core';
import type { PlayerLook } from '@/Core';
import { GameConfig } from '@/Game';
import type { HostState } from '@/Game';

const look: PlayerLook = { character: 'Butterfly', color: 'Coral' };

/** A lobby holding these names, one seat each. */
function lobby(...names: string[]): HostState {
  const players = new Map();
  names.forEach((name, index) => {
    players.set(`p${index + 1}`, { name, look, isOnline: true });
  });
  return { phase: 'Lobby', players, cumulativeScores: new Map(), pace: 'Standard' };
}

/** A fixed seed, so a roll is the same on every run and the test means something. */
const seeded = () => createRandom(20261001);

/** How many players it takes to fill the room. */
const full = () => lobby(...Array.from({ length: GameConfig.limits.maxPlayers }, (_, i) => `P${i}`));

describe('botJoin', () => {
  it('joins the lobby under a seat of its own', () => {
    const action = botJoin(lobby('Dan'), 1, seeded());
    expect(action).toMatchObject({ type: 'JOIN', playerId: 'bot1' });
  });

  it('never takes a seat the roster hands to a player', () => {
    const action = botJoin(lobby('Dan'), 2, seeded());
    expect(action?.playerId).not.toBe('p1');
    expect(action?.playerId).not.toBe('host');
  });

  it('never joins under a name the room is already using', () => {
    const first = botJoin(lobby('Dan'), 1, seeded());
    const second = botJoin(lobby('Dan', first?.name ?? ''), 2, seeded());
    expect(second?.name).not.toBe(first?.name);
  });

  it('never joins a full room', () => {
    expect(botJoin(full(), 1, seeded())).toBeUndefined();
  });

  it('never joins once the room has left the lobby', () => {
    const writing: HostState = {
      phase: 'Writing',
      topic: 'Тема',
      durationMs: 1_000,
      startedAt: 0,
      answers: new Map(),
      cumulativeScores: new Map(),
    };
    expect(botJoin(writing, 1, seeded())).toBeUndefined();
  });
});
