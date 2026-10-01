// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';

const playSound = vi.fn();

vi.mock('../../Sounds', () => ({ playSound }));

const { Button } = await import('./Button');

beforeEach(() => {
  playSound.mockClear();
});

function renderButton(props: Parameters<typeof Button>[0]): HTMLButtonElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<Button {...props}>Играть</Button>, root);
  const button = root.querySelector<HTMLButtonElement>('button');
  if (!button) throw new Error('no button rendered');
  return button;
}

describe('Button', () => {
  it('pops when it is pressed', () => {
    renderButton({}).click();
    expect(playSound).toHaveBeenCalledWith('Pop');
  });

  it('plays nothing when it is muted', () => {
    // Some screens are read in a shared room, and a button that cannot be
    // silenced is a button the whole room has to hear.
    renderButton({ sound: false }).click();
    expect(playSound).not.toHaveBeenCalled();
  });

  it('stays quiet while it is disabled', () => {
    // A disabled button swallows its own clicks, so neither the sound nor the
    // handler should run.
    const onClick = vi.fn();
    renderButton({ disabled: true, onClick }).click();
    expect(onClick).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
  });

  it('plays and then runs the click', () => {
    const onClick = vi.fn();
    renderButton({ onClick }).click();
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});