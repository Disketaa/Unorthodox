# Plan: comment lint rules

Status: in progress. Steps executed one at a time, in order.

## Survey (measured, 323 files)

| Fact | Count |
|---|---|
| Doc blocks `/** */` | 681 |
| Doc blocks longer than 3 lines | 315 (292 non-test) |
| Longest | `App/GameRoom.tsx:49` = 38, `ThemeCard.tsx:70` = 35 |
| Real trailing `//` after code | 16 non-test, 17 in tests |
| Bare `/* */` in `.ts`/`.tsx` body | 4 (2 are `eslint-disable` in `Core/Logger.ts`) |
| `{/* */}` in JSX | 3, all non-test |
| CSS | `/* */` only |

## CSS budget lowered from 8 to 5, on measured evidence

The user asked whether the stylesheet comments earn their place, for an AI agent rather than for a
person. Measured rather than guessed:

- **208 CSS comments, 1452 content lines** across the 39 stylesheets.
- Classified by whether the comment says something the declarations cannot: **~90% carry a decision**,
  **~7% restate the declarations**. The classifier is a keyword heuristic biased toward counting
  value, so 90% is generous. Hand-checked against 8 random samples: 7 genuinely carried a fact.
- **`Tokens.css` is the extreme case: 73 comments, 59 over three lines**, worst at 31, 26, 25.

The deciding argument is not that the comments are valuable — most are — but that **length costs an
agent more than it returns**. A 16-line comment yields about four facts, the rest narrative. And
stale risk scales with length while an agent cannot detect it: one line can be checked against the
declaration in front of it, twenty get accepted wholesale including the part that has drifted.

So the budget went 8 → 5, chosen to keep every "this value looks wrong but is not" note and push
essays into `DECISIONS.md`. What justifies the whole exercise:

- `scrollbar-width: auto` looks like an omission; setting it to `thin` makes Chrome ignore
  `::-webkit-scrollbar` and silently destroys the hover. No agent will guess this.
- `position: absolute` with the note that a positioned box paints over everything unpositioned.
- `--Overlay-BlendMode: multiply` with the note that it preserves relative contrast where `opacity`
  does not.

## Two formatting checks added after the shape work

Neither failure mode is visible to a linter or a test, and both were found by writing a check
rather than by reading. Both are scratch tools; the findings are the durable part.

**Gutter alignment** (`body star = opener indent + 1`). A comment body hangs off its opener's star.
When that drifts the comment still parses and still reads, so nothing fails. Measured across the
repo, `body = opener + 1` is the convention — 57 comments in `Tokens.css` alone already follow it —
so the misaligned ones were outliers, not a competing style. **77 misaligned lines, 9 comments, all
realigned.** Two apparent survivors were my detector being wrong, not the code: a JSX brace
`{/* ... */}` hangs off the brace rather than the opener, and a `*` at column 0 in CSS is a selector
like `*::before` rather than a comment body.

**Double blank lines.** A blank line above and below a comment is right; two in a row is what a
comment replacement leaves behind when the old block was longer than the new one — the old comment's
leading blank line survives. **30 of them across 20 files, all collapsed.** The fixer only removes
lines and asserts that a rewritten line has identical content, because the shape script's habit of
touching more than it meant to is what caused the damage recorded above.

**Two files took real damage during this stretch and were reverted**: `UseSwayMotion.ts` lost
`const MaxSwayPx = 1.5;` and `UseCharacterMotion.ts` lost `const MaxPopOffsetPx = 7;`, both swallowed
by a comment splice. `tsc` caught it with two `TS2304: Cannot find name` and 94 failing tests.
Reverted, then redone by hand. `git diff` now confirms every remaining non-comment change is
intentional: 18 trailing comments removed, and two lines rejoined that a comment had split.

## The shape rule was wrong about single-sentence comments

The user asked why a one-line doc comment was being split across three lines, with the example of
`/** Asking for this theme. Nothing is decided yet, so nothing acts on it yet. */`. It is 68
characters of prose; with the indent and the delimiters it measured 83, two over the 80 limit, so the
rule broke it into a gutter block. **That makes the comment longer, not shorter, and breaks a
sentence the reader wanted whole.**

The rule was testing the wrong thing. It asked "does the whole line fit" when the only question that
matters is "does the prose need more than one line". Two fixes, both in `canonicalShape`:

- A comment whose prose is one paragraph of one line is one line, whatever the delimiters add.
- Prose is reflowed **per paragraph, not per source line**. Reflowing per line preserved whatever
  wrapping the author happened to use and produced orphans — `is` and `keep` alone on their own
  lines — which was worse than the original problem. Paragraphs are joined, then wrapped.
- Prose that rewraps to one or two lines goes back on one line. A gutter block exists to hold a
  paragraph, not to break a sentence in half.

## Comment-value measurement tool

The scratch tool listed CSS comments over a budget with the count **the audit itself would report**,
mirroring `CommentAudit.ts` rather than reimplementing it. An earlier quick script disagreed — 26
findings against the audit's 16 — because it double-counted delimiters. Two counters that disagree
are how a file passes a gate it is failing, so the tool mirrors the gate.

**Also found and fixed in the CSS:** three misaligned `*` gutters, continuation lines at one space
where the opener had three. `Tokens.css:2` and `Sway.module.css:42` were pre-existing;
`Tokens.css:33` I introduced by hand and caught with a gutter-alignment check. The
`ThemeCard.module.css:40` report was a false positive — the opener sits at column 0 inside a nested
block, so column 1 is correct.

## Shape rule (`comments/shape`) — added late, no autofix, no bulk script

Two canonical doc-comment shapes, chosen by width rather than taste: one line if the flattened text
fits 80 columns including the indent and the delimiters, otherwise a gutter block. No third shape,
and a blank star only survives between two paragraphs — leading and trailing blanks are what turned
three lines of prose into six physical lines.

**No autofix and no bulk application script. Four attempts, all corrupt, all reverted.** In order:

1. A standalone codemod (`Scripts/CommentStylize.ts`, deleted) disagreed with the rule by
   construction, and had a `CLOSER` with a leading space producing a double space in every
   collapsed comment.
2. An ESLint `--fix` mangled **57 files** with thousands of leading spaces, because the indent was
   computed as `own.length - own.trimStart().length` — a length, used as a prefix.
3. A bulk script consuming the rule's `expected shape` output got the indent relationship backwards
   and blanked the line before each comment, so `GameRoom.tsx` lost `look: PlayerLook;`.
4. **The same script again, after the indent was fixed — and this one silently deleted code.**
   `UseSwayMotion.ts` lost `const MaxSwayPx = 1.5;` and `UseCharacterMotion.ts` lost
   `const MaxPopOffsetPx = 7;`. Caught by `tsc`, which reported two `TS2304: Cannot find name`.
   The cause: a one-line `const` sitting directly after a comment block, where the splice from the
   comment's start to the next `*/` swallowed it. **94 tests failed** before `tsc` did.

Every one reverted with `git checkout --`, re-verified at **936 tests passing and zero mangled
files**. The lesson is not "scripts are dangerous" — it is that each failure mode surfaced only as
*missing code*, which no lint rule and no comment checker can see. `tsc` caught attempt 4 and nothing
else did.

**The bug that made the rule itself wrong**, found last: `sourceCode.getText(comment)` omits the
indent before the opening delimiter but keeps the indentation on every continuation line. Comparing
that against an expectation built with an indent on line one made 16 of HostRoster's 20 comments
"wrong". Fixed by comparing and returning the shape without a leading indent, which is what
`getText` actually gives. That single change took `comments/shape` from 239 reported violations to
58 real ones.

## Decisions taken (answers to the two open questions)

- A long comment is compressed to the single non-obvious fact it carries; the
  surrounding essay is deleted, not shortened. Rationale that no longer fits in
  three lines belongs in `DECISIONS.md`, not in a comment.
- A trailing comment is deleted when it restates the name next to it, and moved
  above its line when it names something the code cannot say (`// deletion` in a
  Levenshtein row). Nothing stays on the same line as code.
- **Rule A**, settled after the user challenged an inconsistency: a doc comment on a
  named thing at module/class/type scope, a line comment inside a function body.
  Machine-enforced by `comments/form`, so it cannot drift.
- **CSS gets a cap of 8, TypeScript keeps 3.** Measured: 39 stylesheets hold 234
  comments, 180 of them over three lines, and the worst are 31, 26 and 25 lines in
  `Tokens.css`. A three-line cap there would delete the design record, because a token
  scale has no name, type or signature to explain itself through — the comment *is* the
  specification. A cap of 8 still removes every monster and leaves 60 to fix. One
  constant, `CSS_LINE_BUDGET`, if this needs revisiting.
- **One gate per language.** ESLint cannot parse CSS, so `CommentAudit.ts` owns the CSS
  budget and ESLint owns the TypeScript one. An earlier version had both judging
  TypeScript and they disagreed by 17 findings, which is exactly the drift the rule
  exists to prevent.


## Steps

1. Add the three rules to `eslint.config.js` as a local plugin, **off by default**
   so the gate does not go red before the cleanup lands.
   - `comments/max-lines` — one comment (`//` run or `/* */` block) is at most 3 lines
   - `comments/no-trailing` — no comment after code on the same line
   - `comments/no-block-in-ts` — no bare `/* */` inside `.ts`/`.tsx` except eslint directives
   - All three report: `Comment only if the code cannot explain itself.`
2. Test files: `max-lines` off, `no-trailing` off, `no-block-in-ts` on. Tests get
   length freedom, not a second dialect.
3. Fix the 315 existing long comments, file by file.
4. Fix the 33 real trailing comments.
5. Fix the 4 bare `/* */` in TS bodies.
6. Report the same three checks from `Scripts/CommentAudit.ts` so `npm run comments` sees them.
7. Update the COMMENTS section of `.kilo/AGENTS.md` and add a `DECISIONS.md` line.
8. Turn the rules on, run `npm run check`.

## Step log

- **Step 1 done.** `Scripts/CommentRules.js` holds the plugin; registered in `eslint.config.js`.
  Two bugs found and fixed while writing it: the doc comment contained a literal closing
  delimiter and killed the module, and `no-trailing` compared against *all* preceding text
  instead of the current line, which reported 815 false positives instead of 18.
- **Step 2 done.** Tests keep `max-lines` and `no-trailing` off, `form` and `no-block-in-ts` on.
  Tool syntax (`eslint-disable`, `@vitest-environment`) is exempt from every rule.
- **Form rule added** (rule A, machine-checked): doc comment at module/class/type scope, line
  comment inside a function body. Written after the user challenged an inconsistency — I had
  applied "scope" while the plan said "declaration vs statement", and nothing enforced either.
  Uses range containment, not ancestry, because a doc comment above a top-level function also has
  that function as an ancestor. 26 real violations, all fixed.
- **Steps 4 and 5 done.** 18 trailing comments moved above their line or deleted; 4 bare block
  comments in TS bodies converted.
- **Step 3 in progress.** 126 comments over three content lines remain, across 70 files.
  - Done: `Source/Network/` (46), `Network/HostRoster.ts` (11), `RollGlyph.ts` (9),
    `SoundBank.ts` (8), all of `Design/Overlays/GlyphField/`, `Design/Primitives/Sway/`,
    `Design/Components/` (31). `npm test` still 142 files / 936 tests passing.
  - Next: `App` (41), `Game` (18), `Core` (13), `Screens` (10), `Content` (4),
    `Design/Primitives` and `Design/Accent` remainder.
  - Note for the rest: three *content* lines is the cap, and `printWidth` is 80, so the reliable
    shape is one summary line, a free `*` separator, then **two** body lines. A third body line
    spills the comment over budget — that was the single most common mistake while doing Network.
    Simplest reliable recipe that worked through `Design`: keep the summary, keep the one fact the
    code cannot say, delete everything else.
  - Comment-form check: 371 one-line and 322 guttered doc comments, zero exceptions after fixing
    `App/RoomCode.ts:12` and `Network/Payload.ts:47`, which had a one-line doc comment with the code
    jammed onto the same line.
