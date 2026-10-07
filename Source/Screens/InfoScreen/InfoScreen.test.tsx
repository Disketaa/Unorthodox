// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { InfoScreen, InfoScreenProps } from './InfoScreen';

/** The screen on the page, with a count of how often its button was pressed. */
function renderScreen(props: Partial<InfoScreenProps> = {}): {
  root: HTMLElement;
  button: HTMLButtonElement;
  acknowledgements: () => number;
} {
  const root = document.createElement('div');
  document.body.appendChild(root);
  let acknowledged = 0;
  act(() => {
    render(
      <InfoScreen
        message="Хост вышел из комнаты"
        onAcknowledge={() => (acknowledged += 1)}
        {...props}
      />,
      root
    );
  });
  const button = root.querySelector('button');
  if (button === null) {
    throw new Error('the screen has no button on it');
  }
  return { root, button, acknowledgements: () => acknowledged };
}

describe('InfoScreen', () => {
  it('shows the message it was given', () => {
    const screen = renderScreen({ message: 'Это имя уже занято' });
    expect(screen.root.textContent ?? '').toContain('Это имя уже занято');
  });

  it('acknowledges through one button, and nothing else to press', () => {
    const screen = renderScreen();
    expect(screen.root.querySelectorAll('button')).toHaveLength(1);

    act(() => {
      screen.button.click();
    });
    expect(screen.acknowledgements()).toBe(1);
  });

  it('has no heading, because the message is the whole screen', () => {
    // A title above the message would be a second thing to read, and the info
    // screens are the ones a player reads when something has already gone wrong.
    const screen = renderScreen();
    expect(screen.root.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });

  it('puts the message on the plank, with the button below it', () => {
    // The order is the layout: the sentence, then the way out of it, and nothing in
    // between that would be read instead of either. The plank is the only thing on
    // the screen besides that button, so finding both in order says nothing else
    // got between them.
    const screen = renderScreen();
    const text = screen.root.textContent ?? '';
    expect(text.startsWith('Хост вышел')).toBe(true);
    expect(text.endsWith('Ок')).toBe(true);
    expect(screen.button.textContent).toBe('Ок');
  });

  it('says what its own button does, when the screen gives it a word', () => {
    // A screen that is still waiting has settled nothing, so the button on it
    // cannot be the one that acknowledges a fact. It gives up the wait instead,
    // and says so in the word rather than leaving the player to guess.
    const screen = renderScreen({ mark: 'Loading', action: 'Отмена' });
    expect(screen.button.textContent).toBe('Отмена');
  });
});
