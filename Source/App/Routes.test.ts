import { describe, it, expect } from 'vitest';
import { parseRoute, roomPath } from './Routes';

describe('Route parsing', () => {
  it('reads a plain numeric room path', () => {
    expect(parseRoute('#/Room/1234/Host')).toEqual({
      kind: 'Room',
      roomCode: '1234',
      role: 'Host',
    });
  });

  it('round-trips a path through encoding and parsing', () => {
    const path = roomPath('1234', 'Player');
    const encoded = `#${encodeURI(path.replace('#', ''))}`;
    expect(parseRoute(encoded)).toEqual({
      kind: 'Room',
      roomCode: '1234',
      role: 'Player',
    });
  });

  it('reads the player role', () => {
    expect(parseRoute('#/Room/5678/Player')).toEqual({
      kind: 'Room',
      roomCode: '5678',
      role: 'Player',
    });
  });
});

describe('Route rejections', () => {
  it('rejects a room code that is too short', () => {
    expect(parseRoute('#/Room/123/Host').kind).toBe('Join');
  });

  it('rejects a room code that is too long instead of truncating it', () => {
    // Normalising cuts to four characters, so without an explicit check a five
    // character path would join the wrong room rather than fail.
    expect(parseRoute('#/Room/12345/Host').kind).toBe('Join');
  });

  it('rejects a room code that is not digits', () => {
    expect(parseRoute('#/Room/ABCD/Host').kind).toBe('Join');
  });

  it('rejects an unknown role', () => {
    expect(parseRoute('#/Room/БГДЖ/Spectator').kind).toBe('Join');
  });

  it('falls back to the join screen for an empty or unknown hash', () => {
    expect(parseRoute('').kind).toBe('Join');
    expect(parseRoute('#').kind).toBe('Join');
    expect(parseRoute('#/nonsense').kind).toBe('Join');
  });

  it('does not throw on a malformed escape sequence', () => {
    // A broken percent escape would throw inside decodeURIComponent and leave a
    // blank page, so it has to degrade to the join screen instead.
    expect(parseRoute('#/Room/%E0%A4%A/Host').kind).toBe('Join');
  });

  it('reads the gallery route', () => {
    expect(parseRoute('#/Gallery').kind).toBe('Gallery');
  });
});
