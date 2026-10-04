// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { App } from './App';

const NameStorageKey = 'unorthodox.playerName';

function renderApp() {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<App />, root);
  return root;
}

/**
 * Types into a field, as the player's keystrokes arrive.
 *
 * Wrapped in `act` because the app holds the name as state, and a click
 * immediately after a keystroke would otherwise read the name as it was before
 * it.
 */
async function type(root: HTMLElement, index: number, value: string): Promise<void> {
  const field = root.querySelectorAll('input[type="text"]')[index];
  if (!(field instanceof HTMLInputElement)) throw new Error(`no field at ${index}`);
  await act(async () => {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** The name the form is showing right now. */
function nameField(root: HTMLElement): HTMLInputElement {
  const field = root.querySelectorAll('input[type="text"]')[0];
  if (!(field instanceof HTMLInputElement)) throw new Error('no name field');
  return field;
}

async function clickButton(root: HTMLElement, label: string): Promise<void> {
  await act(async () => {
    const button = Array.from(root.querySelectorAll('button')).find(
      (candidate) => candidate.textContent === label,
    );
    button?.click();
  });
}

/**
 * Smoke test for the whole app.
 *
 * The unit tests cover logic in isolation, so a module that throws on import or
 * a component that renders nothing would pass all of them while the real page
 * stays blank. This renders the app once and checks something appears.
 */
describe('App smoke test', () => {
  beforeEach(() => {
    window.location.hash = '';
    localStorage.clear();
  });

  it('renders the join screen with a name field', () => {
    const root = renderApp();

    expect(root.textContent ?? '').toContain('Нестандартненько');
    expect(root.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('keeps the name only once a room is entered, not while it is typed', async () => {
    const root = renderApp();

    await type(root, 0, 'Аня');
    expect(localStorage.getItem(NameStorageKey)).toBeNull();

    await clickButton(root, 'Войти');
    // The code is empty, so the join is refused and the name stays uncommitted.
    expect(localStorage.getItem(NameStorageKey)).toBeNull();

    await type(root, 1, '1234');
    await clickButton(root, 'Войти');
    expect(localStorage.getItem(NameStorageKey)).toBe('Аня');
  });

  it('saves the name when a room is created, since hosting is also entering', async () => {
    const root = renderApp();

    await type(root, 0, 'Аня');
    await clickButton(root, 'Создать комнату');

    expect(localStorage.getItem(NameStorageKey)).toBe('Аня');
  });

  it('starts from the name left by the last room entered, in a new tab', () => {
    localStorage.setItem(NameStorageKey, 'Аня');
    const root = renderApp();

    expect(nameField(root).value).toBe('Аня');
  });

  it('renders the paper background texture, hidden from assistive tech', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    render(<App />, root);

    const layer = root.querySelector('[aria-hidden="true"]');
    expect(layer).not.toBeNull();
    // The texture is a plain tiled background, not a video, so the component
    // moves it by setting a custom property rather than playing anything.
    expect(root.querySelector('video')).toBeNull();
  });
});
