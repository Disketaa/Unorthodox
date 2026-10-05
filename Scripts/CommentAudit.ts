/**
 * Report comments that restate the code instead of adding to it.
 *
 * Three outcomes per comment: `noisy` (safe to delete), `stale` (an unresolved
 * question or a hedge, which needs a decision rather than a deletion), or
 * `kept`. The classification is mechanical on purpose: it only proposes, and
 * nothing is rewritten. `stale` exits non-zero so it can gate a commit.
 *
 * CSS is skipped unless `--css` is passed, and `--css` finds nothing: every
 * comment in the stylesheets records a design decision.
 *
 * Usage: npm run comments [-- --css] [-- <path>]
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

type Verdict = "kept" | "noisy" | "stale";

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly verdict: Verdict;
  readonly reasons: readonly string[];
  readonly text: string;
}

interface RawComment {
  readonly line: number;
  readonly endLine: number;
  readonly text: string;
  readonly block: boolean;
  /** Content lines: blank lines and bare gutter stars are free, as in `CommentRules.js`. */
  readonly lines: number;
  /** A `//` after code on the same line, annotating that code rather than the next. */
  readonly trailing: boolean;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css"];
const ROOT = "Source";

const SIGNAL_TABLE = [
  {
    name: "tutorial",
    pattern: /\b(step\s*\d|first,|then,|next,|now we|finally,|after that)\b/i,
    verdict: "noisy" as const,
  },
  {
    name: "scaffolding",
    pattern: /^\s*(we'?ll|we will|will add|will define)\b/i,
    verdict: "noisy" as const,
  },
  {
    name: "todo",
    pattern: /\b(TODO|FIXME|XXX)\b/,
    verdict: "noisy" as const,
  },
  {
    name: "tag",
    pattern: /@(param|returns?|type|throws)\b/i,
    verdict: "noisy" as const,
  },
  {
    name: "header",
    pattern: /^\s*(define|create|set up|initialize|initialise|declare|add|handle|import|check)\b/i,
    verdict: "noisy" as const,
  },
  {
    name: "question",
    pattern: /\?\s*$/,
    verdict: "stale" as const,
  },
  {
    name: "hedge",
    pattern: /\b(not sure|no idea|might need|maybe we|could add|probably should|ignore or wait|for now,? assume)\b/i,
    verdict: "stale" as const,
  },
];

const NOISE_WORDS = new Set([
  "a", "an", "the", "this", "that", "these", "those", "it", "its", "we", "our",
  "you", "your", "and", "or", "of", "to", "in", "on", "for", "from", "by",
  "is", "are", "be", "as", "at", "with", "into", "so", "if", "then", "than",
  "but", "not", "no", "one", "two", "any", "all", "each", "every", "more",
  "less", "very", "just", "only", "also", "now", "new", "old", "here", "there",
]);

/** English words are the only ones that can match code identifiers usefully. */
const CODE_WORDS = new Set([
  "const", "let", "var", "function", "return", "return", "export", "default",
  "class", "interface", "type", "enum", "import", "from", "async", "await",
  "true", "false", "null", "undefined", "this", "super", "new", "void",
  "string", "number", "boolean", "readonly", "private", "public", "if", "else",
  "for", "of", "in", "while", "switch", "case", "break", "continue", "throw",
  "try", "catch", "finally", "yield", "delete", "typeof", "instanceof",
]);

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9]*/g) ?? []).filter(
    (word) => !NOISE_WORDS.has(word) && !CODE_WORDS.has(word) && word.length > 2,
  );
}

/**
 * Split identifiers on camelCase and underscores so `phaseStartedAt` and the
 * comment's "phase start time" can be compared.
 */
function looseWords(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.match(/[A-Za-z][a-z0-9]*/g) ?? []) {
    for (const part of match.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_$]+/)) {
      const lower = part.toLowerCase();
      if (lower.length > 2 && !NOISE_WORDS.has(lower) && !CODE_WORDS.has(lower)) {
        found.add(lower);
      }
    }
  }
  return found;
}

function isBlockCommentStart(line: string, column: number): boolean {
  return line.slice(column, column + 2) === "/*";
}

/** Line comments only, since block comments are almost always real prose here. */
function collectComments(source: string, isCss: boolean): RawComment[] {
  const lines = source.split(/\r?\n/);
  const found: RawComment[] = [];
  let inString: string | null = null;
  let inTemplate = false;
  let inLineComment = false;
  let blockStart = -1;
  let blockBuffer: string[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (inLineComment) {
      inLineComment = false;
    } else if (blockStart >= 0) {
      const close = line.indexOf("*/");
      blockBuffer.push(close >= 0 ? line.slice(0, close) : line);
      if (close >= 0) {
        found.push(makeBlock(blockStart, lineNumber, blockBuffer));
        blockStart = -1;
        blockBuffer = [];
      }
      return;
    }

    let column = 0;
    while (column < line.length) {
      if (inString !== null) {
        if (line[column] === "\\") {
          column += 2;
          continue;
        }
        if (line[column] === inString) inString = null;
        column += 1;
        continue;
      }
      if (inTemplate) {
        if (line[column] === "\\") {
          column += 2;
          continue;
        }
        if (line[column] === "`") inTemplate = false;
        if (line[column] === "$" && line[column + 1] === "{") inTemplate = false;
        column += 1;
        continue;
      }

      const character = line[column];
      if (character === '"' || character === "'") {
        inString = character;
        column += 1;
        continue;
      }
      if (character === "`") {
        inTemplate = true;
        column += 1;
        continue;
      }
      if (character === "/" && line[column + 1] === "/") {
        if (!isCss) {
          found.push({
            line: lineNumber,
            endLine: lineNumber,
            text: line.slice(column + 2).trim(),
            block: false,
            lines: 1,
            trailing: line.slice(0, column).trim() !== "",
          });
        }
        inLineComment = true;
        return;
      }
      if (isBlockCommentStart(line, column)) {
        blockStart = lineNumber;
        blockBuffer = [line.slice(column + 2)];
        const sameLineClose = line.indexOf("*/", column + 2);
        if (sameLineClose >= 0) {
          blockBuffer[0] = line.slice(column + 2, sameLineClose);
          found.push(makeBlock(lineNumber, lineNumber, blockBuffer));
          blockStart = -1;
          blockBuffer = [];
          column = sameLineClose + 2;
          continue;
        }
        return;
      }
      column += 1;
    }
  });

  return mergeParagraphs(found.filter((comment) => comment.text.length > 0));
}

/** Blank lines and bare gutter stars carry nothing, so they do not spend the budget. */
function countContentLines(text: string): number {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\*[ \t]?/, ""))
    .filter((line) => line.trim() !== "").length;
}

/** Strip the leading `*` gutter from each line of a doc comment. */
function makeBlock(startLine: number, endLine: number, buffer: readonly string[]): RawComment {
  const text = buffer
    .map((lineText, index) => (index === 0 ? lineText : lineText.replace(/^\s*\*[ \t]?/, "")))
    .join("\n")
    .replace(/^\s*\n/, "")
    .replace(/\n\s*$/, "")
    .trim();
  return {
    line: startLine,
    endLine: endLine,
    text,
    block: true,
    lines: countContentLines(text),
    trailing: false,
  };
}

/**
 * Consecutive `//` lines are one comment. Judged line by line, the middle of a
 * sentence reads as its own fragment and picks up signals from words that
 * belong to a sentence it never saw.
 */
function mergeParagraphs(comments: readonly RawComment[]): RawComment[] {
  const merged: RawComment[] = [];
  for (const comment of comments) {
    const previous = merged[merged.length - 1];
    const adjacent = previous !== undefined && comment.line === previous.endLine + 1;
    // A trailing comment annotates the code before it on its own line, so two
    // adjacent ones are two annotations, not one sentence split over two lines.
    if (
      previous !== undefined &&
      !previous.block &&
      !comment.block &&
      !previous.trailing &&
      !comment.trailing &&
      adjacent
    ) {
      merged[merged.length - 1] = {
        line: previous.line,
        endLine: comment.endLine,
        text: `${previous.text} ${comment.text}`.trim(),
        block: false,
        lines: previous.lines + comment.lines,
        trailing: false,
      };
      continue;
    }
    merged.push(comment);
  }
  return merged;
}

/** The code a comment describes: the next line, or the one it sits behind. */
function followingCode(source: string, comment: RawComment): string {
  const lines = source.split(/\r?\n/);
  if (comment.trailing) {
    const own = lines[comment.line - 1] ?? "";
    return own.split("//")[0].trim();
  }
  for (let index = comment.endLine; index < lines.length; index += 1) {
    const trimmed = (lines[index] ?? "").trim();
    if (trimmed === "" || /^(\/\*|\*|\*\/|\/\/)/.test(trimmed)) {
      continue;
    }
    if (trimmed.startsWith("}")) {
      // A comment inside a rule describes the selector above it, not the brace.
      for (let back = comment.line - 2; back >= 0; back -= 1) {
        const above = (lines[back] ?? "").trim();
        if (above === "" || /^(\/\*|\*|\*\/|\/\/)/.test(above)) continue;
        return above.replace(/\s*\{.*$/, "").trim();
      }
      return trimmed;
    }
    return trimmed;
  }
  return "";
}

function classify(comment: RawComment, following: string): { verdict: Verdict; reasons: string[] } {
  const reasons: string[] = [];
  let verdict: Verdict = "kept";

  for (const signal of SIGNAL_TABLE) {
    if (signal.pattern.test(comment.text)) {
      reasons.push(signal.name);
      if (signal.verdict === "stale") {
        verdict = "stale";
      } else if (verdict !== "stale") {
        verdict = "noisy";
      }
    }
  }

  if (following !== "") {
    const commentWords = words(comment.text);
    const shared = new Set(looseWords(following));
    const overlap = commentWords.filter((word) => shared.has(word)).length;
    if (commentWords.length === 1) {
      // One word over a class selector restates the class: `/* Padding */` above
      // `.PaddingXs`. The same word above a custom property is a section heading
      // for a block of them (`/* Layout */` above `--Layout-*`), which is worth
      // keeping in a long file, so tokens are excluded.
      if (overlap === 1 && /^\.[A-Za-z]/.test(following)) {
        reasons.push("restates-class");
        if (verdict !== "stale") verdict = "noisy";
      }
    } else if (commentWords.length >= 2 && overlap / commentWords.length >= 0.6) {
      reasons.push("restates-code");
      if (verdict !== "stale") verdict = "noisy";
    }
  }

  return { verdict, reasons };
}

function walk(directory: string, into: string[]): void {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, into);
      continue;
    }
    if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) into.push(full);
  }
}

/**
 * The stylesheet line budget. TypeScript has none here on purpose: `npm run lint` owns that rule
 * through `comments/max-lines`, and two gates judging the same comment is how the two drift apart.
 * CSS is not linted by ESLint, so this script is its only enforcement.
 *
 * Six, rather than the three TypeScript gets, and the reason is who is reading. A comment in a
 * stylesheet is usually the specification — a token scale, a variant pair — and there is no name,
 * type or signature for it to explain itself through. Three cannot hold a decision and its
 * consequence, so the essays get deleted and the reasoning goes to `DECISIONS.md`.
 *
 * Six is one more than that budget, not one more than a round number: it is what a decision plus
 * the two consequences of changing it actually needs, and it was measured rather than guessed.
 * Measured across the 39 stylesheets: 208 comments averaging seven content lines. A longer comment
 * costs an agent more than it returns, because the facts are buried and the narrative around them
 * goes stale without anyone noticing. Six keeps every "this value looks wrong but is not" note —
 * the ones that stop a reader tidying it away — and pushes the rest out.
 */
const CSS_LINE_BUDGET = 6;

function overCssBudget(comment: RawComment): boolean {
  return comment.lines > CSS_LINE_BUDGET;
}

function main(): void {
  const args = process.argv.slice(2);
  const target = args.find((argument) => !argument.startsWith("--")) ?? ROOT;
  const includeCss = args.includes("--css");

  const files: string[] = [];
  const stats = statSync(target);
  if (stats.isDirectory()) walk(target, files);
  else files.push(target);

  const findings: Finding[] = [];
  for (const file of files.sort()) {
    const isCss = file.endsWith(".css");
    if (isCss && !includeCss) continue;
    const source = readFileSync(file, "utf8");
    for (const comment of collectComments(source, isCss)) {
      const { verdict, reasons } = classify(comment, followingCode(source, comment));
      const overBy = isCss && overCssBudget(comment);
      if (verdict === "kept" && !overBy) continue;
      findings.push({
        file: relative(process.cwd(), file).split(sep).join("/"),
        line: comment.line,
        verdict: verdict === "kept" ? "stale" : verdict,
        reasons: verdict === "kept" ? ["over-budget"] : reasons,
        text: comment.text.replace(/\s+/g, " ").trim().slice(0, 90),
      });
    }
  }

  const stale = findings.filter((finding) => finding.verdict === "stale");
  const noisy = findings.filter((finding) => finding.verdict === "noisy");

  for (const [label, group] of [["STALE", stale], ["NOISY", noisy]] as const) {
    if (group.length === 0) continue;
    console.log(`\n${label} (${group.length})`);
    for (const finding of group) {
      console.log(
        `  ${finding.file}:${finding.line}  [${finding.reasons.join(", ")}]  ${finding.text}`,
      );
    }
  }

  console.log(`\n${noisy.length} noisy, ${stale.length} stale, of ${files.length} files.`);
  if (stale.length > 0) process.exitCode = 1;
}

main();