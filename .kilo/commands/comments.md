# Comments
You are about to write a comment. Check first whether the code already says it. If it does, delete it.

**Default: no comment.** Allowed only for what code cannot say — why this approach over the
obvious one, a constraint that would be "tidied" away, a rule the data shape hides, a failure
mode found by using it. Never for parameters, obvious fields, locals, imports, or the line the
next line already explains. If a bad name is the only reason, fix the name.

**Form:** `/** */` on a declaration (only this shows on hover), `//` on a statement, `/* */` in
CSS, `{/* */}` in JSX. Bare `/* */` inside `.ts`/`.tsx` is wrong; `eslint-disable` and JSX braces
excepted. A gutter block stays `/** */`, never `//`.

**Budget: three content lines.** CSS six. Tests exempt. Short prose is one line; never pad it
into a block. `npm run comments:format` owns the shape — don't hand-write it.

**Banned:** restatement, narration, open questions ("?", "might", "not sure"), trailing comments
(any file, including CSS), one comment split by a blank line.

```bash
npm run lint            # max-lines, shape, no-trailing, no-block-in-ts, no-split, form
npm run comments:css    # same audit for stylesheets
npm run comments:format # rewrite to canonical shape
```

Every finding: *Comment only if the code cannot explain itself.* Dispose of it by hand — delete,
shorten, or move. Never silence the rule.