/** Rewrites every block comment in the tree to the canonical shape. Scoped to block comments
 * only. A `//` comment cannot be reshaped: it has no closing delimiter and no gutter, so the
 * only thing that could change about it is the author's words, which are not this tool's to
 * touch. Trailing comments are skipped. A comment sharing its line with code is prohibited, and
 * there is no indent to reflow to, so reshaping one would only mangle it. Run `npm run
 * comments:format` to rewrite, `--check` to report without writing. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { canonicalShape } from "./CommentShape.mjs";

const ROOT = ".";
const CHECK_ONLY = process.argv.includes("--check");
const EXTENSIONS = /\.(ts|tsx|js|mjs|css)$/;
const SKIP_DIRECTORIES = new Set(["node_modules", "dist", ".git", "worktrees"]);

/** Byte offsets of every block comment, with the text before the delimiter on their own line.
 * Scans character by character rather than with a regex, because a regex cannot tell a comment
 * from a string that happens to hold `/*`, and a stylesheet's `url()` holds a slash in nearly
 * every line. Strings, template literals and their interpolations are all tracked so a `//`
 * inside one is never mistaken for the start of a line comment. */
function findBlockComments(source) {
  const found = [];
  let index = 0;
  let inString = null;
  let inTemplate = false;
  const templateStack = [];
  // Depth of `{` inside the current `${`, so the matching `}` can close it.
  let braceDepth = 0;

  while (index < source.length) {
    const character = source[index];

    if (inString !== null) {
      if (character === "\\") {
        index += 2;
        continue;
      }
      if (character === inString) inString = null;
      index += 1;
      continue;
    }

    if (inTemplate) {
      if (character === "\\") {
        index += 2;
        continue;
      }
      if (character === "`") {
        inTemplate = false;
        templateStack.pop();
        index += 1;
        continue;
      }
      // `${` opens an interpolation, which holds real code and may hold a comment. The brace depth
      // is tracked so the matching `}` puts the template back, including when the interpolation
      // itself contains another template: a `/**` inside a nested literal is still a string.
      if (character === "$" && source[index + 1] === "{") {
        templateStack.push(inTemplate);
        inTemplate = false;
        braceDepth = 0;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      inString = character;
      index += 1;
      continue;
    }
    if (character === "`") {
      inTemplate = true;
      templateStack.push(false);
      index += 1;
      continue;
    }

    // Inside an interpolation, braces decide where the template resumes.
    if (templateStack.length > 0 && !inTemplate && !inString) {
      if (character === "{") braceDepth += 1;
      else if (character === "}") {
        if (braceDepth === 0) {
          inTemplate = templateStack.pop() ?? false;
          index += 1;
          continue;
        }
        braceDepth -= 1;
      }
    }

    if (character === "/" && source[index + 1] === "*") {
      const start = index;
      const close = source.indexOf("*/", index + 2);
      if (close < 0) break;
      found.push({ start, end: close + 2, value: source.slice(index + 2, close) });
      index = close + 2;
      continue;
    }

    if (character === "/" && source[index + 1] === "/") {
      const newline = source.indexOf("\n", index);
      index = newline < 0 ? source.length : newline;
      continue;
    }

    index += 1;
  }
  return found;
}

function lineIndent(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  const lineEnd = source.indexOf("\n", offset);
  const line = source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd);
  return { line, indent: line.slice(0, line.length - line.trimStart().length) };
}

function formatSource(source) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const comments = findBlockComments(source);
  let output = "";
  let cursor = 0;
  let changed = 0;

  for (const comment of comments) {
    const { line, indent } = lineIndent(source, comment.start);
    const doc = comment.value.startsWith("*");
    const shaped = canonicalShape(comment.value, indent, eol, doc);

    output += source.slice(cursor, comment.start);
    cursor = comment.end;

    if (shaped === null) {
      output += source.slice(comment.start, comment.end);
      continue;
    }
    // A comment sharing its line with code keeps the author's text: there is no indent to reflow to.
    if (line.slice(0, comment.start - (source.lastIndexOf("\n", comment.start - 1) + 1)).trim() !== "") {
      output += source.slice(comment.start, comment.end);
      continue;
    }
    if (shaped !== source.slice(comment.start, comment.end)) changed += 1;
    output += shaped;
  }
  output += source.slice(cursor);
  return { output, changed };
}

function collect(directory, into = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRECTORIES.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) collect(full, into);
    else if (EXTENSIONS.test(entry.name)) into.push(full);
  }
  return into;
}

const files = collect(ROOT).sort();
let totalChanged = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const { output, changed } = formatSource(source);
  if (changed === 0) continue;
  totalChanged += changed;
  if (!CHECK_ONLY) writeFileSync(file, output);
  console.log(`${changed}  ${file.replace(/\\/g, "/")}`);
}
console.log(
  `${totalChanged} comments ${CHECK_ONLY ? "need reshaping" : "reshaped"} across ${files.length} files.`,
);
if (CHECK_ONLY && totalChanged > 0) process.exitCode = 1;
