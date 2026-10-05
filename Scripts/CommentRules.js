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

const MESSAGE = "Comment only if the code cannot explain itself.";

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

/** A comment sharing its line with code in front of it annotates that code, not the next line. */
function isTrailing(sourceCode, comment) {
  const own = (sourceCode.getLines()[comment.loc.start.line - 1] ?? "").slice(
    0,
    comment.loc.start.column,
  );
  return own.trim() !== "" && !isJsxComment(sourceCode.getText(), comment);
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
          "Comment only if the code cannot explain itself — this is module, class or type scope, so it takes a doc comment, not //",
        local:
          "Comment only if the code cannot explain itself — this is inside a function body, so it takes //, not a doc comment",
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
 * Prose that fits on one line is one line, delimited on both ends by that line. Prose that does
 * not is a gutter block, but the delimiters ride on the prose rather than sitting on lines of their
 * own, and no gutter line is ever left blank. Padding a three-line comment out to six physical
 * lines says nothing and reads as ceremony.
 *
 * The gutter block stays a real doc comment rather than a run of line comments. Only a doc comment
 * attaches to a declaration in TypeScript and in every LSP that reads it, so a line comment above a
 * function means no hover text and no IntelliSense. Inside a function body there is no declaration
 * to document, and the `comments/form` rule already asks for a line comment instead.
 *
 * 96 columns, not prettier's 80. That governs code, and every comment body in this repo is written
 * wider: measured across 3730 body lines, the median is 77 and the 98th percentile is 97, so only
 * 2.5% exceed 96. Wrapping to 80 would rewrap two thirds of the comments in the tree and read as
 * churn rather than as a rule.
 */
const PRINT_WIDTH = 96;

function canonicalShape(comment, sourceCode, eol = "\n") {
  const own = sourceCode.getLines()[comment.loc.start.line - 1] ?? "";
  // A comment sharing a line with code keeps the author's text: there is no indent to reflow to.
  if (own.slice(0, comment.loc.start.column).trim() !== "") return sourceCode.getText(comment);
  const indent = " ".repeat(comment.loc.start.column);

  // Paragraph gaps carry no information here, so the prose is flattened before it is re-wrapped.
  const flat = comment.value
    .slice(1)
    .split(/\r?\n/)
    .map((part) => part.replace(/^\s*\*?[ \t]?/, "").trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (flat === "") return sourceCode.getText(comment);

  const lines = reflow(flat, PRINT_WIDTH - indent.length - 3);
  if (lines.length === 1) return `/** ${lines[0]} */`;
  const last = lines.length - 1;
  return lines
    .map((part, index) =>
      index === 0 ? `/** ${part}` : `${indent} * ${part}${index === last ? " */" : ""}`,
    )
    .join(eol);
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
      fixable: "code",
      messages: { shape: `${MESSAGE} — this one is padded out; eslint --fix reshapes it.` },
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
            // The author text is already canonical, so nothing may be rewritten.
            if (sourceCode.getText(comment) === expected) continue;
            context.report({
              node: comment,
              messageId: "shape",
              fix: (fixer) => fixer.replaceText(comment, expected),
            });
          }
        },
      };
    },
  };
}

/**
 * A tool's own pragma, such as `// @vitest-environment`. The runner reads it out of the file's
 * leading comment block and it has to stand as a comment of its own, so it is not a second half
 * of a split one.
 */
function isDirective(comment) {
  return /^@\w[\w-]*\s/.test(comment.value.trimStart());
}

/**
 * A comment whose only separation from the next is a blank line is one comment split in two.
 * Permitting it makes `max-lines` a suggestion: an essay becomes two short notes and the rule is
 * satisfied with nothing shortened. So this is an error, and the pair is counted once against the
 * budget as well, which is what stops the split from being worth doing.
 */
function splitRule() {
  return {
    meta: {
      type: "problem",
      schema: [],
      messages: {
        split: `${MESSAGE} — these two are one comment cut in two; merge them.`,
      },
    },
    create(context) {
      return {
        Program() {
          const sourceCode = context.sourceCode;
          const lines = sourceCode.getLines();
          const comments = sourceCode.getAllComments();
          for (const [index, comment] of comments.entries()) {
            const next = comments[index + 1];
            if (next === undefined) continue;
            if (isDirective(comment) || isDirective(next)) continue;
            // A trailing comment annotates the code on its own line, so two of them are two
            // annotations rather than one comment in halves.
            if (isTrailing(sourceCode, comment) || isTrailing(sourceCode, next)) continue;
            // Directly stacked is already one comment: consecutive `//` lines are one run, and
            // a block comment's own last line is not a separation. Only a blank line between two
            // separate comments is the split.
            if (next.loc.start.line <= comment.loc.end.line + 1) continue;
            const between = lines.slice(comment.loc.end.line, next.loc.start.line - 1);
            if (!between.every((line) => line.trim() === "")) continue;
            context.report({ node: comment, messageId: "split" });
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
    "no-split": splitRule(),
    shape: shapeRule(),
  },
};
