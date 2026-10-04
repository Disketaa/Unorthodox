/**
 * Comment rules for the codebase: length, placement, and one style per file kind.
 *
 * Local plugin rather than a dependency: the three checks are small, and the wording of the
 * message is the point, so it belongs in the repo.
 *
 * Counts comment CONTENT lines, not physical ones. The opening delimiter, the closing one and a
 * `*` gutter line say nothing, so a one-sentence docstring does not spend two of its three lines
 * on punctuation.
 */

const MESSAGE =
  "COMMENT ONLY IF NEEDED, AND CODE IS NOT SELF UNDERSTANABLE IF SO DON'T MAKE A COMMENT";

const MAX_LINES = 3;

/** A line carrying only block-comment punctuation or whitespace. */
function isFiller(text, isFirst, isLast) {
  const trimmed = text.trim();
  if (trimmed === "" || trimmed === "*") return true;
  if (isFirst && (trimmed.startsWith("/**") || trimmed.startsWith("/*"))) return true;
  if (isLast && trimmed.endsWith("*/")) return true;
  return false;
}

function contentLines(text) {
  const lines = text.split("\n");
  return lines.filter((line, index) => !isFiller(line, index === 0, index === lines.length - 1))
    .length;
}

/** Consecutive `//` lines read as one comment; anything between them ends the run. */
function groupLineComments(comments) {
  const groups = [];
  for (const comment of comments) {
    if (comment.type !== "Line") {
      continue;
    }
    const previous = groups[groups.length - 1];
    const adjacent =
      previous !== undefined &&
      previous[previous.length - 1].loc.end.line + 1 === comment.loc.start.line;
    if (adjacent) previous.push(comment);
    else groups.push([comment]);
  }
  return groups.map((group) => ({
    node: group[0],
    text: group.map((comment) => comment.value).join("\n"),
  }));
}

function lengthRule() {
  return {
    meta: { type: "problem", schema: [], messages: { long: MESSAGE } },
    create(context) {
      return {
        Program() {
          const sourceCode = context.sourceCode;
          const units = [
            ...sourceCode
              .getAllComments()
              .filter((comment) => comment.type === "Block")
              .map((comment) => ({ node: comment, text: comment.value })),
            ...groupLineComments(sourceCode.getAllComments()),
          ];
          for (const unit of units) {
            const count = contentLines(unit.text);
            if (count > MAX_LINES) {
              context.report({
                node: unit.node,
                messageId: "long",
                data: { count: String(count) },
              });
            }
          }
        },
      };
    },
  };
}

function trailingRule() {
  return {
    meta: { type: "problem", schema: [], messages: { trailing: MESSAGE } },
    create(context) {
      return {
        Program() {
          const sourceCode = context.sourceCode;
          const text = sourceCode.getText();
          const lines = sourceCode.getLines();
          for (const comment of sourceCode.getAllComments()) {
            // The brace before a JSX comment is JSX syntax, not code this comment annotates.
            if (isJsxComment(text, comment)) continue;
            const own = (lines[comment.loc.start.line - 1] ?? "").slice(
              0,
              comment.loc.start.column,
            );
            if (own.trim() !== "") {
              context.report({ node: comment, messageId: "trailing" });
            }
          }
        },
      };
    },
  };
}

/** A brace-wrapped block comment in JSX has no line-comment equivalent, so it stays allowed. */
function isJsxComment(text, comment) {
  const before = text.slice(0, comment.range[0]).trimEnd();
  return before.endsWith("{") && text.slice(comment.range[1]).trimStart().startsWith("}");
}

function blockInTsRule() {
  return {
    meta: { type: "problem", schema: [], messages: { block: MESSAGE } },
    create(context) {
      return {
        Program() {
          const sourceCode = context.sourceCode;
          const text = sourceCode.getText();
          for (const comment of sourceCode.getAllComments()) {
            if (comment.type !== "Block" || comment.value.startsWith("*")) continue;
            if (/^\s*eslint-(disable|enable)/.test(comment.value)) continue;
            if (isJsxComment(text, comment)) continue;
            context.report({ node: comment, messageId: "block" });
          }
        },
      };
    },
  };
}

/**
 * Rule A, enforced: a doc comment on a named thing at module, class or type scope, a line
 * comment for anything inside a function body. Without this the codebase grows a second
 * dialect one comment at a time, which is exactly what happened the first time round.
 */
function formRule() {
  return {
    meta: {
      type: "problem",
      schema: [],
      messages: {
        scope:
          "COMMENT ONLY IF NEEDED, AND CODE IS NOT SELF UNDERSTANABLE IF SO DON'T MAKE A COMMENT — this is module, class or type scope, so it takes a doc comment, not //",
        local:
          "COMMENT ONLY IF NEEDED, AND CODE IS NOT SELF UNDERSTANABLE IF SO DON'T MAKE A COMMENT — this is inside a function body, so it takes //, not a doc comment",
      },
    },
    create(context) {
      return {
        Program() {
          const sourceCode = context.sourceCode;
          const text = sourceCode.getText();
          for (const comment of sourceCode.getAllComments()) {
            // Tool syntax, exempt from every rule here: eslint directives and vitest pragmas.
            if (/^\s*[@a-z-]*(eslint-(disable|enable)|vitest-environment|ts-ignore|ts-expect-error)/.test(comment.value)) continue;
            const isDoc = comment.type === "Block" && comment.value.startsWith("*");
            if (!isDoc && comment.type === "Block" && !/^\s*eslint-/.test(comment.value)) {
              if (!isJsxComment(text, comment)) continue;
            }
            const insideFunction = isInsideFunctionBody(sourceCode, comment);
            if (isDoc && insideFunction) {
              context.report({ node: comment, messageId: "local" });
            } else if (!isDoc && comment.type === "Line" && !insideFunction) {
              context.report({ node: comment, messageId: "scope" });
            }
          }
        },
      };
    },
  };
}

/**
 * True when the comment sits within the body of a function. Range containment, not ancestry:
 * a doc comment above a top-level function has the function as an ancestor too.
 */
function isInsideFunctionBody(sourceCode, comment) {
  let node = sourceCode.getNodeByRangeIndex(comment.range[0]);
  while (node !== null && node !== undefined) {
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression" ||
      node.type === "ClassMethod" ||
      node.type === "MethodDefinition" ||
      node.type === "PropertyDefinition"
    ) {
      const start = node.body?.loc?.start?.line ?? node.loc.start.line;
      const end = node.body?.loc?.end?.line ?? node.loc.end.line;
      if (comment.loc.start.line > start && comment.loc.start.line <= end) return true;
    }
    node = node.parent;
  }
  return false;
}

/**
 * The two canonical doc-comment shapes.
 *
 * A doc comment whose prose fits one line is one line. One that does not is a gutter block: opening
 * delimiter, aligned lines, closing delimiter, each on its own line. There is no third shape, and in
 * particular a short comment is never padded out to a block — that is what turns three lines of
 * prose into six physical lines, which reads as ceremony.
 *
 * The test is the prose, not the whole line. A single sentence is not split across three lines
 * because the opening delimiter and the closing one pushed it two columns over: that makes the
 * comment longer, not shorter, and the sentence is what the reader wanted. Only prose that
 * genuinely needs wrapping gets a block.
 *
 * Deliberately no autofix. Two attempts at one failed badly: the indent taken from the start of the
 * line was computed wrongly, and the "fix" then rewrote real source. A cosmetic rule that cannot
 * corrupt the codebase is worth keeping; one that can is not, whatever the intent.
 */
const PRINT_WIDTH = 80;

function canonicalShape(comment, sourceCode, eol = "\n") {
  const own = sourceCode.getLines()[comment.loc.start.line - 1] ?? "";
  // A comment sharing a line with code keeps the author's text: there is no indent to reflow to.
  if (own.slice(0, comment.loc.start.column).trim() !== "") return sourceCode.getText(comment);
  const indent = " ".repeat(comment.loc.start.column);

  // The value starts with the `*` that ends the opening delimiter, and that star is not content.
  const flat = comment.value.replace(/^\*/, "").replace(/\s+/g, " ").trim();
  if (flat === "") return sourceCode.getText(comment);

  // Split after the leading star so the opening delimiter's own star is not read as content.
  const parts = comment.value
    .slice(1)
    .split(/\r?\n/)
    .map((part) => part.replace(/^\s*\*?[ \t]?/, "").trim());
  // A blank star is only kept between two paragraphs; leading and trailing blanks are padding.
  while (parts.length > 0 && parts[0] === "") parts.shift();
  while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();

  // Prose on one line is one line, whatever the delimiters add. Reflowed below three lines means
  // the author wrote one sentence, so it goes back on one line: a gutter block exists to hold a
  // paragraph, not to break a sentence in half.
  const paragraphs = [];
  let current = [];
  for (const part of parts) {
    if (part === "") {
      paragraphs.push(current.join(" "));
      current = [];
    } else current.push(part);
  }
  paragraphs.push(current.join(" "));
  const filled = paragraphs.map((text) => (text === "" ? [] : reflow(text, PRINT_WIDTH - indent.length - 3)));
  const lineCount = filled.reduce((total, lines) => total + lines.length, 0);
  if (lineCount <= 2) return `/** ${paragraphs.filter((text) => text !== "").join(" ")} */`;

  const wrapped = [];
  filled.forEach((lines, index) => {
    if (index > 0) wrapped.push("");
    wrapped.push(...lines);
  });
  const body = wrapped.map((part) => (part === "" ? `${indent} *` : `${indent} * ${part}`));
  return ["/**", ...body, `${indent} */`].join(eol);
}

/** Rewrap one paragraph to a width, breaking only at spaces. */
function reflow(text, width) {
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

function shapeRule() {
  return {
    meta: {
      type: "problem",
      schema: [],
      messages: { shape: `${MESSAGE} — expected shape:\n{{expected}}` },
    },
    create(context) {
      return {
        Program() {
          const sourceCode = context.sourceCode;
          const text = sourceCode.getText();
          const eol = text.includes("\r\n") ? "\r\n" : "\n";
          for (const comment of sourceCode.getAllComments()) {
            if (comment.type !== "Block" || !comment.value.startsWith("*")) continue;
            if (isJsxComment(text, comment)) continue;
            const expected = canonicalShape(comment, sourceCode, eol);
            if (sourceCode.getText(comment) === expected) continue;
            context.report({
              node: comment,
              messageId: "shape",
              data: { expected },
            });
          }
        },
      };
    },
  };
}

export const commentPlugin = {
  rules: {
    "max-lines": lengthRule(),
    "no-trailing": trailingRule(),
    "no-block-in-ts": blockInTsRule(),
    "form": formRule(),
    shape: shapeRule(),
  },
};
