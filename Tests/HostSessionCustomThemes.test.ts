// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { HostSession } from '../Source/Network/HostSession';
import { InMemoryTransport } from '../Source/Network/InMemoryTransport';
import { saveCustomThemes } from '../Source/Core';

const custom = (name: string) => ({
  name,
  color: 'Amber' as const,
  questions: ['Вопрос 1'],
});

const look = { character: 'Butterfly', color: 'Coral' } as const;

describe('a host opening a room', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("takes this browser's own themes into the room, so a bank can be dealt from them", () => {
    // The cache is read once per tab and kept, which is why this is the only case here: a second
    // case about an empty cache would see the first one's themes, and that memoization is the
    // cache doing its job rather than a fault to assert against.
    saveCustomThemes(new Map([['Призраки', custom('Призраки')]]));
    const session = new HostSession(new InMemoryTransport());
    session.start('ABCD', 'Ann', look);
    expect(session.getCustomThemes().map((theme) => theme.name)).toContain('Призраки');
  });
});