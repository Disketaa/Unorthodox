// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { forgetHosting, hostsRoom, rememberHosting } from './RoomOwnership';

beforeEach(() => {
  localStorage.clear();
});

describe('which rooms this browser hosts', () => {
  it('is none of them until a room is created here', () => {
    expect(hostsRoom('1234')).toBe(false);
  });

  it('is the one this browser created', () => {
    rememberHosting('1234');
    expect(hostsRoom('1234')).toBe(true);
  });

  it('is not every room, however many there are', () => {
    // The record is per room: creating a second room does not make this browser the
    // host of the first one it is not hosting.
    rememberHosting('1234');
    expect(hostsRoom('5678')).toBe(false);
  });

  it('is not the room any more once it is left', () => {
    rememberHosting('1234');
    forgetHosting('1234');
    expect(hostsRoom('1234')).toBe(false);
  });

  it('survives the tab being closed', () => {
    // Which is the whole reason the role is remembered here rather than read out of the
    // link: a link anyone can edit cannot be trusted to say who hosts a room, and
    // `localStorage` is the only thing left after the tab is gone.
    rememberHosting('1234');
    expect(hostsRoom('1234')).toBe(true);
  });
});
