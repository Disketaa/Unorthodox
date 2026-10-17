/** What one Enter does to the JSON in the box: the new text, and where the caret lands. */
export interface JsonEnter {
  text: string;
  caret: number;
}

/** The indent of the line the caret is on, copied onto whatever line opens. Copying rather than
 * computing it is what keeps a list of questions one level in for its whole length. */
function indentAt(text: string, caret: number): string {
  const lineStart = text.lastIndexOf('\n', caret - 1) + 1;
  return text.slice(lineStart, caret).match(/^[ \t]*/)?.[0] ?? '';
}

/** Whether the caret sits inside a string, which is every other quote before it. JSON has no
 * escape the editor offers here, so counting the quotes is the whole of it. */
export function isInsideString(text: string, caret: number): boolean {
  let quotes = 0;
  for (let i = 0; i < caret; i += 1) {
    if (text[i] === '"') quotes += 1;
  }
  return quotes % 2 === 1;
}

/** Whether the caret sits on the opening quote of a string, where there is nothing of it yet to
 * split and nothing to close. Pressing Enter there opens a line rather than breaking the word. */
function atStringStart(text: string, caret: number): boolean {
  return text[caret - 1] === '"' && text[caret] !== '"' && isInsideString(text, caret);
}

/** Whether the character before the caret is the quote that closes a string somebody has already
 * finished writing, as in `"Вопрос 2"|`. This is the case that has a comma to add. */
export function isAfterClosingQuote(text: string, caret: number): boolean {
  return text[caret - 1] === '"' && !isInsideString(text, caret);
}

/** Where the line's own comma comes from, and how much of the tail it takes with it. A comma
 * standing just past the caret is pulled back to the end of this line rather than left behind
 * the new one: a comma the room cannot see on its own line is one the host reads as missing. */
function commaFor(text: string, caret: number): { comma: string; skip: number } {
  if (text[caret] === ',') return { comma: ',', skip: 1 };
  if (text[caret - 1] === ',') return { comma: '', skip: 0 };
  return { comma: ',', skip: 0 };
}

/** Whether the caret stands where the next element of a list starts: at the end of a string
 * somebody has finished, or at the comma that closed it. Both are the same moment to the room,
 * and the line either way is about to be a new question. */
export function opensNextElement(text: string, caret: number): boolean {
  return isAfterClosingQuote(text, caret) || text[caret - 1] === ',';
}

/** Whether an element of the list follows whatever is left after the caret. A new question with
 * nothing behind it is the last one, and the last one of a list is the one without a comma. */
function elementFollows(rest: string): boolean {
  return rest.trim() !== '' && !/^\s*[}\]]/.test(rest);
}

/** What Enter does in a JSON box, as a function of the text and the caret rather than of a key
 * press. Wherever the next line is an element of a list, Enter opens an empty string on it and
 * puts the caret inside. */
export function applyJsonEnter(text: string, start: number, end: number): JsonEnter {
  const indent = indentAt(text, start);
  const head = text.slice(0, start);
  const newline = `\n${indent}`;

  if (isInsideString(text, start) && !atStringStart(text, start)) {
    // A quote already standing past the caret is this string's own closing one, so it is consumed
    // here rather than left to close whatever the next line opens.
    const closing = text[end] === '"' ? 1 : 0;
    const rest = text.slice(end + closing);
    return { text: `${head}",${newline}""${rest}`, caret: head.length + 3 + newline.length };
  }

  const { comma, skip } = commaFor(text, start);
  const rest = text.slice(end + skip);
  if (opensNextElement(text, start)) {
    // The new question is an element of the list in its own right, so it is given its own comma
    // whenever something comes after it. Taking the line's old comma for itself and forgetting
    // this one leaves two questions with nothing between them.
    const after = elementFollows(rest) ? ',' : '';
    return {
      text: `${head}${comma}${newline}""${after}${rest}`,
      caret: head.length + comma.length + newline.length + 1,
    };
  }

  return { text: `${head}${newline}${rest}`, caret: head.length + newline.length };
}
