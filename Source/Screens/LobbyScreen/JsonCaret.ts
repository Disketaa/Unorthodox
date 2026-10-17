/** Where the caret lands after a click at `clicked`. A click beside a pair of quotes goes
 * between them, since that is the inside of an empty string. To get past it, click beyond the
 * closing quote or press the arrow. */
export function placeCaret(text: string, clicked: number): number {
  const at = Math.min(text.length, Math.max(0, clicked));
  const opensPair = text[at] === '"' && text[at + 1] === '"';
  const closesPair = text[at - 1] === '"' && text[at] === '"';
  return opensPair || closesPair ? at + 1 : at;
}

/** Where an empty string ending at the caret begins, or -1 where the caret is not on one. The
 * caret may be inside the pair or just past it, since both are the same question to the room. */
function emptyStringAt(text: string, caret: number): number {
  if (text[caret - 1] !== '"') return -1;
  if (text[caret] === '"') return caret - 1;
  if (text[caret - 2] === '"') return caret - 2;
  return -1;
}

/** What is left of the caret's line once the empty string is taken out along with the comma that
 * belongs to it. Anything at all means the line is more than a question of its own. */
function restOfLine(text: string, caret: number, pairStart: number): string {
  const lineStart = text.lastIndexOf('\n', caret - 1) + 1;
  const lineEnd = text.indexOf('\n', caret);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  const head = line.slice(0, pairStart - lineStart);
  const tail = line.slice(pairStart - lineStart + 2).replace(/^[ \t]*,[ \t]*/, '');
  return head + tail;
}

/** What one backspace removes, as text and caret. A backspace on an empty string takes the whole
 * line that question is on, and leaves the caret at the end of the one above: the way back into
 * what the host was writing before Enter. A pair sharing its line is not a question of its own. */
export function applyJsonBackspace(
  text: string,
  start: number,
  end: number
): {
  text: string;
  caret: number;
} {
  if (start !== end) {
    return { text: text.slice(0, start) + text.slice(end), caret: start };
  }
  if (start === 0) return { text, caret: start };

  const pairStart = emptyStringAt(text, start);
  if (pairStart >= 0 && restOfLine(text, start, pairStart).trim() === '') {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', start);
    const tail = lineEnd === -1 ? '' : text.slice(lineEnd + 1);
    return {
      text: text.slice(0, lineStart) + tail,
      caret: lineStart === 0 ? 0 : lineStart - 1,
    };
  }
  if (pairStart >= 0) {
    return { text: text.slice(0, pairStart) + text.slice(pairStart + 2), caret: pairStart };
  }
  return { text: text.slice(0, start - 1) + text.slice(start), caret: start - 1 };
}
