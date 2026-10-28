import { describe, it, expect } from 'vitest';
import { isClientMessage } from './Protocol';

describe('a client answering the theme bank', () => {
  it('names an authored theme or one the host pasted, since both are ids the room can hold', () => {
    // A custom theme's id is its own name rather than one of the registry's, so a check against
    // the authored set would silently drop every press on a pasted card from a client while the
    // host, who never goes through this wire, could still make it.
    expect(isClientMessage({ type: 'ChooseTheme', playerId: 'p1', theme: 'Природа' })).toBe(
      true
    );
    expect(
      isClientMessage({ type: 'ChooseTheme', playerId: 'p1', theme: 'Средневековье' })
    ).toBe(true);
  });

  it('refuses a press that names nothing at all', () => {
    expect(isClientMessage({ type: 'ChooseTheme', playerId: 'p1', theme: '' })).toBe(false);
    expect(isClientMessage({ type: 'ChooseTheme', playerId: 'p1' })).toBe(false);
  });
});
