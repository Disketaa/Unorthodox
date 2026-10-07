// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { JoinScreen } from './JoinScreen';

type Handlers = {
  name: string;
  roomCode: string;
  onNameChange?: (value: string) => void;
  onRoomCodeChange?: (value: string) => void;
  onJoin?: () => void;
  onCreate?: () => void;
};

/** The join screen with the fields filled in, and what each field reports. */
function renderJoinScreen(handlers: Handlers = { name: 'Ann', roomCode: 'ABCD' }): {
  root: HTMLElement;
  joins: () => number;
  creates: () => number;
} {
  const root = document.createElement('div');
  document.body.appendChild(root);
  let joins = 0;
  let creates = 0;
  act(() => {
    render(
      <JoinScreen
        name={handlers.name}
        roomCode={handlers.roomCode}
        onNameChange={handlers.onNameChange ?? (() => {})}
        onRoomCodeChange={handlers.onRoomCodeChange ?? (() => {})}
        onJoin={() => {
          joins += 1;
          handlers.onJoin?.();
        }}
        onCreate={() => {
          creates += 1;
          handlers.onCreate?.();
        }}
      />,
      root
    );
  });
  return { root, joins: () => joins, creates: () => creates };
}

/** Press Enter on a node, as a person typing into it or tabbing to it would. */
function pressEnterOn(node: Element | null | undefined): void {
  act(() => {
    node?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
}

/** Press Enter on whichever field holds a given value, or the first one. */
function pressEnterInField(root: HTMLElement, value: string): void {
  const fields = [...root.querySelectorAll('input')];
  const field = fields.find((input) => input.value === value) ?? fields[0];
  pressEnterOn(field);
}

/** The join button, which Enter must leave to its own click. */
function joinButton(root: HTMLElement): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((button) => button.textContent === 'Войти');
}

describe('Enter on the join screen', () => {
  it('joins from the room code field', () => {
    const screen = renderJoinScreen();
    pressEnterInField(screen.root, 'ABCD');
    expect(screen.joins()).toBe(1);
  });

  it('joins from the name field too, since the code may already be typed', () => {
    const screen = renderJoinScreen();
    pressEnterInField(screen.root, 'Ann');
    expect(screen.joins()).toBe(1);
  });

  it('never creates a room, because Enter means join', () => {
    const screen = renderJoinScreen();
    pressEnterInField(screen.root, 'ABCD');
    expect(screen.creates()).toBe(0);
  });

  it('asks for what is missing rather than joining half a room', () => {
    const screen = renderJoinScreen({ name: 'Ann', roomCode: '' });
    pressEnterInField(screen.root, 'Ann');
    expect(screen.joins()).toBe(0);
    expect(screen.root.textContent ?? '').toContain('Введите код комнаты');
  });

  it('leaves a focused button to its own click, so the press is not counted twice', () => {
    const screen = renderJoinScreen();
    const button = joinButton(screen.root);
    pressEnterOn(button);
    // Nothing yet: the key alone does nothing on a button, the click is its own.
    expect(screen.joins()).toBe(0);
    act(() => {
      button?.click();
    });
    expect(screen.joins()).toBe(1);
  });
});

describe('Other keys on the join screen', () => {
  it('are left alone', () => {
    const screen = renderJoinScreen();
    const field = screen.root.querySelector('input');
    act(() => {
      field?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    });
    expect(screen.joins()).toBe(0);
    expect(screen.creates()).toBe(0);
  });
});
