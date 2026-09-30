// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { App } from './App';

/**
 * Smoke test for the whole app.
 *
 * The unit tests cover logic in isolation, so a module that throws on import or
 * a component that renders nothing would pass all of them while the real page
 * stays blank. This renders the app once and checks something appears.
 */
describe('App smoke test', () => {
  it('renders the join screen with a name field', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    render(<App />, root);

    expect(root.textContent ?? '').toContain('Нестандартненько');
    expect(root.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('renders the paper background video', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    render(<App />, root);

    const video = root.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('loop')).not.toBeNull();
  });
});
