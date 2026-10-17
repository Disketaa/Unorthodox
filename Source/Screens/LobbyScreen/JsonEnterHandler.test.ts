import { describe, it, expect } from 'vitest';
import { applyJsonEnter, isAfterClosingQuote, isInsideString } from './JsonEnterHandler';

/** A room of questions as the box holds it, with the caret marked by `|`. */
function box(text: string): { text: string; caret: number } {
  const caret = text.indexOf('|');
  if (caret < 0) throw new Error('no caret in the fixture');
  return { text: text.replace('|', ''), caret };
}

function enter(fixture: string): { text: string; caret: number } {
  const { text, caret } = box(fixture);
  const result = applyJsonEnter(text, caret, caret);
  return { text: result.text, caret: result.caret };
}

/** The result with the caret put back in, so a case reads as what the room is left looking at. */
function shown(fixture: string): string {
  const result = enter(fixture);
  return `${result.text.slice(0, result.caret)}|${result.text.slice(result.caret)}`;
}

describe('where the caret is', () => {
  it('is inside a string between two quotes and outside one past two', () => {
    const { text, caret } = box('"Вопрос 1|"');
    expect(isInsideString(text, caret)).toBe(true);
    const after = box('"Вопрос 1"|');
    expect(isInsideString(after.text, after.caret)).toBe(false);
  });

  it('is after a closing quote only where one closes something', () => {
    const after = box('"Вопрос 1"|');
    expect(isAfterClosingQuote(after.text, after.caret)).toBe(true);
    const inside = box('"Вопрос |1"');
    expect(isAfterClosingQuote(inside.text, inside.caret)).toBe(false);
  });
});

describe('Enter in a list of questions', () => {
  it('closes the string it is inside, adds the comma and opens the next one', () => {
    // The case the room types all day: a question a line, and no closing quote per line. The caret
    // lands inside the new pair, so the next word is typed straight in.
    expect(shown('    "Вопрос 1|"\n  ]')).toBe('    "Вопрос 1",\n    "|"\n  ]');
  });

  it('takes the closing quote already typed instead of leaving it over the new line', () => {
    // The host who closes the quote before pressing Enter would otherwise be left with one quote
    // too many, opening on the line below and closing nothing.
    expect(shown('    "Вопрос 1"|')).toBe('    "Вопрос 1",\n    "|"');
  });

  it('leaves the last question of a list without a comma of its own', () => {
    // A trailing comma in front of the closing bracket is a JSON error, and the editor would be the
    // one that put it there.
    expect(shown('    "Вопрос 1",|\n  ]')).toBe('    "Вопрос 1",\n    "|"\n  ]');
  });

  it('leaves the comma on the line it belongs to and gives the new question one of its own', () => {
    // Two bugs in one line, both seen in the same room. The old comma used to drift down onto the
    // new line, and then the new question was left with no comma at all and the two of them were
    // not an array any more.
    expect(shown('    "asdas"|\n    "23123"')).toBe('    "asdas",\n    "|",\n    "23123"');
  });

  it('does not put a second comma where one is already standing', () => {
    // The line already ends the way the list needs it to, and a comma on top of that comma is a
    // JSON error the editor made on the way to helping.
    expect(shown('    "Вопрос 1",|\n    "Вопрос 2",\n  ]')).toBe(
      '    "Вопрос 1",\n    "|",\n    "Вопрос 2",\n  ]'
    );
  });

  it('opens a line when the caret sits on the opening quote of a string', () => {
    // Nothing of the string has been written yet, so there is no word here to break in two.
    expect(shown('    "|asdas"')).toBe('    "\n    |asdas"');
  });

  it('copies the indent of the line it was pressed on', () => {
    expect(shown('        "Вопрос 1|"')).toBe('        "Вопрос 1",\n        "|"');
  });

  it('is a plain indented line anywhere it is not inside or after a string', () => {
    expect(shown('  {|\n  }')).toBe('  {\n  |\n  }');
  });

  it('opens an empty box with the caret on the fresh line', () => {
    expect(shown('|')).toBe('\n|');
  });
});
