// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { Leaderboard, type LeaderboardRow } from './Leaderboard';

/** The show is a run of beats on timers, so the clock is held: a test reads the list where it
 * was left rather than wherever the beats had got to, and no beat outlives the test that
 * started it. */
afterEach(() => {
  vi.useRealTimers();
});

/** A room as the leaderboard draws it: three players in three places. */
function rows(): LeaderboardRow[] {
  return [
    { id: 'p0', name: 'Anya', character: 'Butterfly', color: 'Coral', score: 42, rank: 1 },
    { id: 'p1', name: 'Berenice', character: 'Ghost', color: 'Sky', score: 31, rank: 2 },
    { id: 'p2', name: 'Tobias', character: 'Star', color: 'Violet', score: 17, rank: 3 },
  ];
}

/** Mount a leaderboard and hand back what the browser sees. */
function mounted(board: LeaderboardRow[] = rows()): Element {
  vi.useFakeTimers();
  const root = document.body.appendChild(document.createElement('div'));
  act(() => {
    render(<Leaderboard rows={board} />, root);
  });
  return root;
}

describe('the room standing', () => {
  it('draws one row per player, each with the player in it', () => {
    // A place is a line of a table: the player, their name and what they have.
    const root = mounted();
    expect(root.querySelectorAll('li')).toHaveLength(3);
    expect(root.querySelectorAll('[class*="Figure"]')).toHaveLength(3);
  });

  it('leads each line with the place, ahead of the player', () => {
    // The number is the player's own place, and it stands at the head of the line: a place is a
    // thing the room reads, so it is a column of its own rather than a shape behind the body.
    const root = mounted();
    const places = root.querySelectorAll('[class*="Place"]');
    expect([...places].map((place) => place.textContent)).toEqual(['1', '2', '3']);
    const place = root.querySelector('li [class*="Place"]');
    expect(place?.nextElementSibling?.className).toContain('Figure');
  });

  it('keeps the place out of the way of the name', () => {
    // The figure is decoration, so it is hidden from anything reading the row aloud: a place
    // announced as a figure would be read as part of the name.
    const place = mounted().querySelector('[class*="Place"]');
    expect(place?.getAttribute('aria-hidden')).toBe('true');
  });

  it('writes each player’s name and score on the row', () => {
    const root = mounted();
    expect(root.textContent).toContain('Anya');
    expect(root.textContent).toContain('42');
  });

  it('holds a lost player’s line back without dropping it', () => {
    // A player the host has lost still stands in the list — the place is theirs — and their line
    // is held back the way the bar holds back a seat that dropped, so one held-back thing means
    // one thing wherever the room sees it.
    const board = rows();
    board[1].isOnline = false;
    const root = mounted(board);
    expect(root.querySelectorAll('li')).toHaveLength(3);
    expect(root.querySelectorAll('[class*="Offline"]')).toHaveLength(1);
    expect(root.querySelector('li:nth-child(2)')?.className).toContain('Offline');
  });
});
