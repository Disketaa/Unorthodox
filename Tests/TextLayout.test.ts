import { describe, it, expect } from 'vitest';
import { stylesheet } from './Stylesheet';

const text = stylesheet('../Source/Design/Primitives/Text/Text.module.css');
const Topic = /\.VariantTopic[^{]*\{([^}]*)\}/;

describe('the round’s question over a board of answers', () => {
  it('is written in the page’s own ink, and not the reader’s accent', () => {
    // The question is the room’s and not this browser’s: a board of answers under it is black and
    // white, and a question in one player’s tint says the board belongs to them. The same text is
    // over the board in the review and in the count, so one rule covers both.
    expect(text.declaration(Topic, 'color')).toBe('var(--Color-Text-Default)');
  });
});
