import { describe, it, expect } from 'vitest';
import { applyJsonBackspace, placeCaret } from './JsonCaret';

describe('where a click leaves the caret', () => {
  it('goes inside an empty string when clicked just after its opening quote', () => {
    // The click a host makes on a question they want to type, and the pair is already standing
    // there for them because Enter left it.
    expect(placeCaret('[""]', 2)).toBe(3);
  });

  it('goes inside the pair when clicked on the opening quote itself', () => {
    expect(placeCaret('[""]', 1)).toBe(2);
  });

  it('leaves the caret where it was clicked past the pair', () => {
    // The way out of a pair is past its closing quote, and a caret that could never leave one
    // would trap the host inside the first question they typed.
    expect(placeCaret('[""]', 3)).toBe(3);
    expect(placeCaret('[""]', 4)).toBe(4);
  });

  it('leaves the caret alone anywhere else in the text', () => {
    expect(placeCaret('  "name": |', 11)).toBe(11);
    expect(placeCaret('', 0)).toBe(0);
  });
});

describe('backspace in a JSON box', () => {
  it('takes the whole line an empty string stands on, and lands back in the question above', () => {
    // The way back into the question the host was writing before Enter opened a line for them.
    // Taking only the quotes would leave a blank line to delete a second time.
    expect(applyJsonBackspace('    "asdasd"\n    ""\n  ]', 18, 18)).toEqual({
      text: '    "asdasd"\n  ]',
      caret: 12,
    });
  });

  it('takes the comma the empty string belonged to along with it', () => {
    // The empty question carried a separator of its own. Left behind, it would have become a comma
    // after the question above, which is not what a list of questions looks like.
    expect(applyJsonBackspace('    "a",\n    "",\n    "c",\n  ]', 14, 14)).toEqual({
      text: '    "a",\n    "c",\n  ]',
      caret: 8,
    });
  });

  it('takes the pair alone when it shares its line with something else', () => {
    // There is no question of its own here to take, so this is two stray quotes and only that.
    expect(applyJsonBackspace('[""]', 2, 2)).toEqual({ text: '[]', caret: 1 });
  });

  it('takes the pair alone when the caret stands just past its closing quote', () => {
    expect(applyJsonBackspace('[""]', 3, 3)).toEqual({ text: '[]', caret: 1 });
  });

  it('takes one character everywhere else, which is what backspace has always meant', () => {
    expect(applyJsonBackspace('    "abc"', 8, 8)).toEqual({ text: '    "ab"', caret: 7 });
  });

  it('takes nothing at the very start', () => {
    expect(applyJsonBackspace('""', 0, 0)).toEqual({ text: '""', caret: 0 });
  });

  it('takes a whole selection whatever it holds', () => {
    expect(applyJsonBackspace('    "abc"', 4, 7)).toEqual({ text: '    c"', caret: 4 });
  });
});
