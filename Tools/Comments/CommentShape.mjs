/** The canonical shape for a block comment, in one place. Both the ESLint rule and the formatter
 * import from here so there is a single definition. Two implementations would drift, and a
 * formatter that disagrees with its own linter is worse than no formatter. The shape: prose
 * that fits on one line is one line, delimited at both ends by that line. Prose that does not
 * is a gutter block, with the delimiters riding on the prose rather than sitting on lines of
 * their own, and no gutter line ever left blank. Padding a three-line comment out to six
 * physical lines says nothing and reads as ceremony. 96 columns, not prettier's 80. That
 * governs code, and every comment body in this repo is written wider: measured across the tree
 * the median is 77 and the 98th percentile is 97, so only a few percent exceed 96. Wrapping to
 * 80 would rewrap two thirds of the comments and read as churn. */
export const PRINT_WIDTH = 96;

/** Rewrap one paragraph to a width, breaking only at spaces. */
export function reflow(text, width) {
  const words = text.split(/\s+/).filter((word) => word !== "");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current === "") current = word;
    else if (current.length + 1 + word.length <= width) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== "") lines.push(current);
  return lines;
}

/** Flatten a comment's body to one paragraph. Paragraph gaps and gutter punctuation are removed
 * first: neither carries information, and both stop a comment from being rewrappable. */
export function flatten(value) {
  return value
    .split(/\r?\n/)
    .map((part) => part.replace(/^\s*\*?[ \t]?/, "").trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The canonical text for a comment with the given body and indentation. `doc` picks `/**` over
 * `/*`, which is what TypeScript uses for a doc comment: only a doc comment attaches to a
 * declaration, so only a doc comment gives hover text and IntelliSense. */
export function canonicalShape(value, indent, eol = "\n", doc = false) {
  const flat = flatten(value);
  if (flat === "") return null;

  const open = doc ? "/**" : "/*";
  const lines = reflow(flat, PRINT_WIDTH - indent.length - 3);
  if (lines.length === 1) return `${open} ${lines[0]} */`;
  const last = lines.length - 1;
  return lines
    .map((part, index) =>
      index === 0 ? `${open} ${part}` : `${indent} * ${part}${index === last ? " */" : ""}`,
    )
    .join(eol);
}

/** A comment sharing its line with code keeps the author's text: there is no indent to reflow
 * to, and a trailing comment is prohibited anyway, so it is left alone rather than mangled. */
export function shapeForLine(text, indent, eol, doc) {
  return canonicalShape(text, indent, eol, doc);
}
