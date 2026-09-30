import { describe, it, expect } from 'vitest';
import { parseRoute, roomPath } from './Routes';

describe('Route parsing', () => {
  it('reads a plain Cyrillic room path', () => {
    expect(parseRoute('#/Room/ЖЗЩЛ/Host')).toEqual({
      kind: 'Room',
      roomCode: 'ЖЗЩЛ',
      role: 'Host',
    });
  });

  it('reads a percent-encoded room path, which is what the browser produces', () => {
    // Cyrillic in a URL is percent-encoded, so the hash arrives encoded and must
    // be decoded before the code can be read.
    expect(parseRoute('#/Room/%D0%96%D0%97%D0%A9%D0%9B/Host')).toEqual({
      kind: 'Room',
      roomCode: 'ЖЗЩЛ',
      role: 'Host',
    });
  });

  it('round-trips a path through encoding and parsing', () => {
    const path = roomPath('ЖЗЩЛ', 'Player');
    const encoded = `#${encodeURI(path.replace('#', ''))}`;
    expect(parseRoute(encoded)).toEqual({
      kind: 'Room',
      roomCode: 'ЖЗЩЛ',
      role: 'Player',
    });
  });

  it('reads the player role', () => {
    expect(parseRoute('#/Room/БГДЖ/Player')).toEqual({
      kind: 'Room',
      roomCode: 'БГДЖ',
      role: 'Player',
    });
  });
});

describe('Route rejections', () => {
  it('rejects a room code that is too short', () => {
    expect(parseRoute('#/Room/БГД/Host').kind).toBe('Join');
  });

  it('rejects a room code that is too long instead of truncating it', () => {
    // Normalising cuts to four letters, so without an explicit check a five
    // letter path would join the wrong room rather than fail.
    expect(parseRoute('#/Room/БГДЖЗ/Host').kind).toBe('Join');
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
