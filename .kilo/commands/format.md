# Format
You are about to hand over code. It goes through the formatters first — never paste unformatted
code and ask someone else to clean it up.

**One formatter per language, and it owns that language.** Prettier formats `Source/**/*.{ts,tsx}`
and `Source/**/*.css`, nothing else; `eslint-config-prettier` turns formatting conflicts off so
the two never argue. `Tools/Comments/FormatComments.mjs` owns block-comment shape and is the only
thing that rewrites one. Do not hand-wrap a doc comment — the formatter reflows it to the
canonical shape, and prose you padded into a gutter block is prose you already made worse.

```bash
npm run format              # prettier --write Source/**/*.{ts,tsx}
npm run format:css          # prettier --write Source/**/*.css
npm run comments:format     # rewrite block comments to canonical shape
uq fix                      # eslint --fix + prettier over the stylesheets
```

Run the first three over the files you touched, `uq fix` before handing over. All four are
idempotent: a second run must produce no diff, and one that does is a bug to report, not a
formatting choice to accept.

**What a formatter cannot decide.** These are yours, and no script hands them back:

- A file past 150 lines or a function past 40 is not made shorter by wrapping. Split it.
- A comment over budget, or one that restates, narrates, or asks a question, survives reflow.
  Delete or shorten it — see `/comments`.
- Two adjacent `//` lines that want to be one, and a long call that deserves a named constant
  instead of a wrapped line. Formatting hides the smell; it does not remove it.

**Every file ends with exactly one newline**, and no two blank lines sit together. Prettier
guarantees the newline; ESLint `eol-last` and the CSS `eof` verdict report it. CSS is not linted by
ESLint, so `npm run comments:css` is the gate that owns stylesheets — read its `eof` and `mojibake`
verdicts, not just the count.

**Text stays UTF-8.** Text decoded twice is rejected by `encoding/no-mojibake` and by the CSS
`mojibake` verdict. Never write a signature out literally to explain it, not even in a comment —
that puts the damage in the file explaining it.

Verify before handing over:

```bash
npm run check
```

Format, then lint, typecheck, comment audit, comment shape, tests, build — in that order, because
each gate is cheaper to run than to debug. A changed `.css` also runs the `Tests/` suites: they
read stylesheets with `node:fs` instead of importing them, so the import graph alone would report
no tests for a token change.