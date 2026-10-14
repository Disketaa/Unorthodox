// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { DebugDock } from './DebugDock';
import { Button } from '@/Design/Components';

/** Mount the dock with one control in it and press it the way a mouse does. A real press also
 * lands the focus on the button, which is the half of this a bare click event does not do. */
function pressControl(): HTMLButtonElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  let pressed = 0;
  act(() => {
    render(
      <DebugDock enabled>
        <Button onClick={() => (pressed += 1)}>skip</Button>
      </DebugDock>,
      root
    );
  });
  const button = root.querySelector('button');
  if (button === null) throw new Error('the dock drew no control');
  act(() => {
    button.focus();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expect(pressed).toBe(1);
  return button;
}

describe('the debug dock', () => {
  it('draws nothing while it is off', () => {
    const root = document.createElement('div');
    act(() => {
      render(
        <DebugDock enabled={false}>
          <Button onClick={() => {}}>skip</Button>
        </DebugDock>,
        root
      );
    });
    expect(root.querySelector('button')).toBeNull();
  });

  it('passes a press on to the control that was pressed', () => {
    pressControl();
  });

  it('lets go of the focus after a press, so Enter is not answered by it again', () => {
    expect(document.activeElement).not.toBe(pressControl());
  });
});
