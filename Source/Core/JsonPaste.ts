/** Take the fence off a paste that carries one: JSON copied out of a chat or a readme brings the
 * backticks and the language tag with it, and neither is part of the theme. Only a fence with a
 * closing fence is taken, so text merely starting with backticks keeps what follows it. */
export function unwrapJsonFence(json: string): string {
  const text = json.trim();
  const opening = /^```[a-zA-Z]*\r?\n/.exec(text);
  if (opening === null) return text;
  const rest = text.slice(opening[0].length);
  const closing = rest.lastIndexOf('```');
  if (closing === -1) return text;
  return rest.slice(0, closing).trim();
}

/** Whether a paste carries a code fence, so the editor can put the unwrapped text in the box
 * rather than leaving the host to look at their own backticks. */
export function hasJsonFence(json: string): boolean {
  return unwrapJsonFence(json) !== json.trim();
}

/** Take off the comma a paste leaves before a closing bracket. It comes from copying rather than
 * typing: a chat or spreadsheet ends its last entry with a comma, and JSON has no comma there.
 * Strings are stepped over, so a comma inside a question's wording is left alone. */
export function stripTrailingCommas(text: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += text[i + 1] ?? '';
        i += 1;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === ',') {
      // Look ahead past whitespace for the bracket this comma is standing in front of.
      let ahead = i + 1;
      while (ahead < text.length && /\s/.test(text[ahead] ?? '')) ahead += 1;
      if (text[ahead] === '}' || text[ahead] === ']') continue;
    }
    out += ch;
  }
  return out;
}
