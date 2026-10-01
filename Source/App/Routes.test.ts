// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { navigate, parseRoute, pruneStrayPath, roomPath } from './Routes';

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

describe('Navigation', () => {
  it('leaves no fragment behind when returning to the entry screen', () => {
    // A bare '#' rides along in every link copied out of the app, so the root
    // route has to drop the fragment rather than assign an empty hash.
    window.location.hash = '#/Room/1234/Host';
    navigate('');

    expect(window.location.hash).toBe('');
    expect(window.location.href).not.toContain('#');
  });

  it('keeps the search string, so a debug link survives leaving a room', () => {
    window.history.replaceState(null, '', '/Unorthodox/?debug');

    navigate('');

    expect(window.location.search).toBe('?debug');
  });

  it('notifies the router, which listens for hashchange', () => {
    let notified = 0;
    window.addEventListener('hashchange', () => {
      notified += 1;
    });

    navigate('');

    expect(notified).toBe(1);
  });

  it('puts a room path in the fragment', () => {
    navigate(roomPath('1234', 'Player'));

    expect(parseRoute(window.location.hash)).toEqual({
      kind: 'Room',
      roomCode: '1234',
      role: 'Player',
    });
  });
});

describe('Stray path pruning', () => {
  it('removes a path a hand-typed link left behind', () => {
    // Routing lives in the fragment, so this path is dead weight that would ride
    // along in every link copied out of the app, and 404 on GitHub Pages.
    window.history.replaceState(null, '', '/Room/5978/Host#/Room/4362/Host');

    pruneStrayPath();

    expect(window.location.pathname).toBe('/');
    expect(parseRoute(window.location.hash)).toEqual({
      kind: 'Room',
      roomCode: '4362',
      role: 'Host',
    });
  });

  it('leaves a deploy base path alone', () => {
    window.history.replaceState(null, '', '/Unorthodox/Room/5978/Host');

    pruneStrayPath();

    expect(window.location.pathname).toBe('/Unorthodox/');
  });

  it('keeps the search string and the fragment', () => {
    window.history.replaceState(null, '', '/Unorthodox/Room/5978/Host?debug#/Gallery');

    pruneStrayPath();

    expect(window.location.pathname).toBe('/Unorthodox/');
    expect(window.location.search).toBe('?debug');
    expect(window.location.hash).toBe('#/Gallery');
  });

  it('leaves a path that names no route untouched', () => {
    window.history.replaceState(null, '', '/Unorthodox/');

    pruneStrayPath();

    expect(window.location.pathname).toBe('/Unorthodox/');
  });
});
