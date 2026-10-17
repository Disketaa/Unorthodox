/** The walk over a paste of JSON that names where it stops making sense. The problem is carried
 * as a reason and a place rather than as a sentence, since the wording belongs to the popup. */
export type JsonSyntaxProblem = {
  reason:
    | 'UnclosedString'
    | 'UnclosedBracket'
    | 'MismatchedBracket'
    | 'TrailingComma'
    | 'MissingValue'
    | 'UnexpectedChar'
    | 'UnexpectedEnd';
  line: number;
  column: number;
};

/** A line and a column as a host counts them in their editor: from one, not from zero. */
type Place = { line: number; column: number };

/** A bracket left open, where it was opened and which kind it was, so a closing one can be
 * matched against it and the line pointed at the bracket left hanging. */
type Frame = Place & { at: number; char: '{' | '[' };

/** Everything the walk knows at the point it is at: what is open, what has been read, and where
 * in the paste that was. One object rather than a dozen locals, so the helpers that read a
 * character can be handed the state and can hand back what they changed. */
type Walk = {
  open: Frame[];
  inString: boolean;
  escaped: boolean;
  stringStart: Place;
  afterValue: boolean;
  expectValue: boolean;
  line: number;
  column: number;
  lastComma: (Place & { at: number }) | undefined;
};

const startWalk = (): Walk => ({
  open: [],
  inString: false,
  escaped: false,
  stringStart: { line: 1, column: 1 },
  afterValue: false,
  expectValue: false,
  line: 1,
  column: 1,
  lastComma: undefined,
});

/** The place moves on as the text is walked, a newline being the only thing that starts a new
 * line, so that the line and column in a message are the ones a host sees in their editor. */
const step = (walk: Walk, ch: string): void => {
  if (ch === '\n') {
    walk.line += 1;
    walk.column = 1;
  } else {
    walk.column += 1;
  }
};

/** A character inside a string, where the only things that matter are the escape that cancels
 * the next character and the quote that ends it — anything else is wording, not structure. */
const walkString = (walk: Walk, ch: string): void => {
  if (walk.escaped) walk.escaped = false;
  else if (ch === '\\') walk.escaped = true;
  else if (ch === '"') {
    walk.inString = false;
    walk.afterValue = true;
  }
  step(walk, ch);
};

/** A quote outside a string, which either opens one or arrives where a value has already been
 * read — two names or two values side by side, with nothing standing between them. */
const walkQuote = (walk: Walk, ch: string): JsonSyntaxProblem | undefined => {
  if (walk.afterValue)
    return { reason: 'UnexpectedChar', line: walk.line, column: walk.column };
  walk.inString = true;
  walk.stringStart = { line: walk.line, column: walk.column };
  walk.afterValue = false;
  walk.expectValue = false;
  step(walk, ch);
  return undefined;
};

/** A bracket opening. Recorded on the stack rather than only counted, since the walk is what has
 * to say which bracket is left hanging at the end of a paste that stops halfway. */
const walkOpen = (walk: Walk, i: number, ch: '{' | '['): JsonSyntaxProblem | undefined => {
  if (walk.afterValue)
    return { reason: 'UnexpectedChar', line: walk.line, column: walk.column };
  walk.open.push({ at: i, line: walk.line, column: walk.column, char: ch });
  walk.afterValue = false;
  walk.expectValue = false;
  step(walk, ch);
  return undefined;
};

/** A bracket closing while a value is still wanted is a comma standing in front of it: the one
 * fault a paste arrives with most often, and the one the parser's own message is least use for,
 * since it names the bracket rather than the comma the host has to delete. */
const walkClose = (walk: Walk, ch: string): JsonSyntaxProblem | undefined => {
  if (walk.expectValue && walk.lastComma !== undefined) {
    return { reason: 'TrailingComma', ...walk.lastComma };
  }
  const frame = walk.open[walk.open.length - 1];
  const wanted: '{' | '[' = ch === '}' ? '{' : '[';
  if (frame === undefined || frame.char !== wanted) {
    return { reason: 'MismatchedBracket', line: walk.line, column: walk.column };
  }
  walk.open.pop();
  walk.afterValue = true;
  walk.expectValue = false;
  step(walk, ch);
  return undefined;
};

/** A comma, which says a value has been read and another is wanted. At the top level there is
 * nothing for it to separate, so it is a comma with nothing around it at all. */
const walkComma = (walk: Walk, i: number, ch: string): JsonSyntaxProblem | undefined => {
  if (walk.open.length === 0) {
    return { reason: 'UnexpectedChar', line: walk.line, column: walk.column };
  }
  walk.lastComma = { at: i, line: walk.line, column: walk.column };
  walk.afterValue = false;
  walk.expectValue = true;
  step(walk, ch);
  return undefined;
};

/** A colon, which names what follows inside an object. Anywhere else it has nothing to name, so
 * a question mark or a bare word written where a key belongs lands here. */
const walkColon = (walk: Walk, ch: string): JsonSyntaxProblem | undefined => {
  if (walk.open[walk.open.length - 1]?.char !== '{') {
    return { reason: 'UnexpectedChar', line: walk.line, column: walk.column };
  }
  walk.expectValue = true;
  walk.afterValue = false;
  step(walk, ch);
  return undefined;
};

/** Anything left is the start of a bare value: a number, true, false or null. Only its start
 * matters here, since what follows it is `JSON.parse`'s business and not this scan's. */
const walkBare = (walk: Walk, ch: string): JsonSyntaxProblem | undefined => {
  if (walk.afterValue)
    return { reason: 'UnexpectedChar', line: walk.line, column: walk.column };
  walk.afterValue = true;
  walk.expectValue = false;
  step(walk, ch);
  return undefined;
};

/** Hand one character to whichever walk reads that kind of character. Whitespace is stepped over
 * without being looked at, since JSON has no other use for it than to sit between two things. */
const walkChar = (walk: Walk, i: number, ch: string): JsonSyntaxProblem | undefined => {
  if (walk.inString) {
    walkString(walk, ch);
    return undefined;
  }
  if (ch === '"') return walkQuote(walk, ch);
  if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
    step(walk, ch);
    return undefined;
  }
  if (ch === '{' || ch === '[') return walkOpen(walk, i, ch);
  if (ch === '}' || ch === ']') return walkClose(walk, ch);
  if (ch === ',') return walkComma(walk, i, ch);
  if (ch === ':') return walkColon(walk, ch);
  return walkBare(walk, ch);
};

/** What the walk is left holding once the text has run out: a string or a bracket never closed,
 * or a comma or colon with nothing after it. A comma with nothing after it is one a paste left
 * behind; a colon with nothing after it is a value the host has not written yet. */
const endOfText = (walk: Walk, text: string): JsonSyntaxProblem | undefined => {
  if (walk.inString) return { reason: 'UnclosedString', ...walk.stringStart };
  const leftOpen = walk.open[walk.open.length - 1];
  if (leftOpen !== undefined) return { reason: 'UnclosedBracket', ...leftOpen };
  if (!walk.expectValue) return undefined;
  if (walk.lastComma === undefined)
    return { reason: 'MissingValue', line: walk.line, column: walk.column };
  const onlySpaceAfter = text.slice(walk.lastComma.at + 1).trim().length === 0;
  return onlySpaceAfter
    ? { reason: 'TrailingComma', ...walk.lastComma }
    : { reason: 'MissingValue', ...walk.lastComma };
};

/** Walk the JSON by hand and say where it first stops making sense. The parser itself would say
 * so in the browser's own words — "Unexpected end of JSON input", or a position counted from
 * zero that means nothing to a host — so the structure is read here instead. */
export function findJsonSyntaxProblem(text: string): JsonSyntaxProblem | undefined {
  const walk = startWalk();
  for (let i = 0; i < text.length; i++) {
    const problem = walkChar(walk, i, text[i] ?? '');
    if (problem !== undefined) return problem;
  }
  return endOfText(walk, text);
}
