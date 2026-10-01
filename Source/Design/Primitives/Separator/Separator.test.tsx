// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { Separator } from './Separator';

/** The separator on the page, with whatever it was given inside it. */
function renderSeparator(children?: string): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(<Separator>{children}</Separator>, root);
  return root;
}

describe('Separator', () => {
  it('is a separator to a screen reader when it is a bare rule', () => {
    // A line with nothing in it is a boundary, and the role is the only thing that
    // says so: without it the rule is a div and reads as nothing at all.
    const root = renderSeparator();
    expect(root.querySelector('[role="separator"]')).not.toBeNull();
  });

  it('puts the word it was given in the rule', () => {
    const root = renderSeparator('Лобби');
    expect(root.textContent ?? '').toContain('Лобби');
  });

  it('is not a separator once it carries a word, which is a label on the part', () => {
    // A labelled rule is announcing the name of a boundary when read as a
    // separator, and the word is naming what sits below it instead.
    const root = renderSeparator('Лобби');
    expect(root.querySelector('[role="separator"]')).toBeNull();
  });

  it('draws the rule on both sides of the word, not only one', () => {
    // One run of the rule is a line that stops short, which reads as two unrelated
    // lines rather than as one rule broken by a label.
    const root = renderSeparator('Лобби');
    expect(root.querySelectorAll('span')).toHaveLength(3);
  });
});
