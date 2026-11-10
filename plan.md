# Plan A: Remove Redundancy and Reach Full Line Coverage

## Goal

Remove demonstrably redundant or unreachable first-party code without changing intended behavior, and establish an enforceable coverage gate for executable production code. Treat coverage as evidence that code ran, not proof that its behavior is correct.

The stated long-term target is 100% line coverage. The current phase establishes an **interim regression gate** at the measured level (63% lines / 52% branches / 58% functions) so the gate can pass and future changes cannot reduce coverage. Reaching 100% remains a follow-up phase.

"All lines triggered" needs a measurable boundary: types, declarations, generated output, dependencies, and test harness code do not all represent runtime-executable production lines. The target is every executable line in the agreed first-party production scope, with exclusions listed and justified. If a line is genuinely unreachable, remove it rather than hide it from the report.

## Repository Evidence

- `.kilo/AGENTS.md` defines module boundaries, pure `Game/` logic, network and UI contracts, and the required validation commands. Preserve intentional dynamic entry points such as the component gallery, hash routes, CSS modules, CLI commands, and relay startup.
- `.kilo/commands/design.md` requires token-based styling, component encapsulation, strict typing, and component galleries. Similar-looking components are not redundant if their public variants or behaviors differ.
- `npm run check` is the project-wide gate. TypeScript enables `noUnusedLocals` and `noUnusedParameters`.
- The README reports 936 unit tests and documents browser tests separately. The current npm scripts and Vite/Vitest configuration do not define a coverage command, coverage provider, or coverage threshold.
- GitHub Actions currently runs lint, Vitest, and build on pushes to `main`; typecheck and coverage are not CI steps.

## Baseline (captured 2026-11-10)

- **Lint**: 81 errors, all in `Tests/Browser/PerfBrowser.test.ts` (`no-explicit-any`, `no-empty`). Pre-existing on branch.
- **Typecheck**: errors in `Source/Network/RelaySocket.ts` (TS2322) and `Tests/Browser/PerfBrowser.test.ts` (TS2345, TS2551, TS18048, TS2769). Pre-existing on branch.
- **Tests**: 156 files, 1286 passed, 3 skipped. All pass.
- **Build**: passes, 549 modules, ~290KB JS + ~156KB CSS.
- **Uncommitted changes**: none (only untracked `plan.md`).

# Plan: Code-Usage and Redundancy Audit

## Purpose

Find and remove first-party code that is demonstrably unused or genuinely redundant, while preserving behavior, public contracts, and dynamically reached code. This is a repository-wide usage/reachability audit; it is separate from the existing line-coverage project.

Do not treat "100% code usage" as a percentage that a compiler or coverage tool can prove. Runtime coverage answers whether executed lines ran in tests. Reachability analysis answers whether a symbol, file, dependency, generated path, or feature has a real caller. A file can be used while many of its lines are untested; a line can be covered in a test while its feature is unused in the shipped app.

## Current Facts and Leads

- The active application uses numeric group indexes. `Source/Game/Grouping.ts` assigns `groupId` from the array index, and `Source/Network/Protocol.ts` declares group IDs as `number` on the wire.
- `Source/Core/Types.ts` declares `export type GroupId = string`. A case-sensitive repository search found only this declaration for the exact `GroupId` identifier. `Source/Core/index.ts` re-exports `Types.ts`, but no in-repository consumer imports the alias. This is the highest-confidence candidate: verify the project is not promising this type to external package consumers, then remove the unused alias rather than changing the numeric group-ID path.
- The letter-pair code is active game behavior, not an obsolete room-code generator. `Source/Game/ThemeModifiers.ts` samples `LetterPairs` for letter-based enchantments; `Source/App/Views/EffectLabels.ts` converts pairs for display; the writing-demand path checks required letters. Preserve it.
- Room codes are numeric: `Source/App/RoomCode.ts` generates and normalizes digits, and `RoomCode.test.ts` asserts digit-only behavior. Its `normalizeRoomCode` comment saying "room letter" and `Routes.ts` comment saying "five letter path" are stale wording candidates, not evidence of an old generator. Correct wording only if the behavior remains unchanged.
- `Source/Network/ClientIdentity.ts` generates a 16-byte random hexadecimal browser identity and persists it. That identity is not a room code or group index; it distinguishes clients and is used by `ClientSession`.
- `Source/Core/Random.ts` hashes seed text to produce deterministic numeric randomness used in several game deals. It is not a generator for user-visible identifiers.
- The earlier coverage milestone added a Vitest v8 provider and an interim gate (63% lines / 52% branches / 58% functions). The long-term 100% executable-line target remains deferred. Do not mark this usage audit complete merely because the coverage gate passes.
- The toolchain now uses TypeScript 7 for the `tsc` CLI and TypeScript 6 through the `typescript` package alias for `typescript-eslint`. ESLint uses a local content cache. Keep that arrangement intact unless a separately verified issue requires changing it.

## Definitions

- **Used**: reachable from a known application, server, test, development-tool, build, or external-package entry point, either by static reference or a verified dynamic mechanism.
- **Unused candidate**: has no verified caller or side effect after all relevant entry points and dynamic registrations have been checked. A text search with no hits is only a lead, not proof.
- **Redundant candidate**: duplicates another implementation's responsibility and behavior. Similar names or similar-looking code are insufficient evidence; compare inputs, outputs, edge cases, ownership, and callers.
- **Stale documentation**: comments or plan text no longer describe actual behavior. This is not dead code; update only the wording that is demonstrably wrong.
- **Runtime coverage**: whether tests executed code. Coverage is not a call graph, dead-code detector, or proof that a feature is product-required.

## Scope

Audit tracked, first-party repository files and record their role. Include application and server code, tests, development tools, scripts, configuration, package dependencies, generated-data inputs, static-asset references, and CI/workspace commands in the inventory. Classify them by role instead of treating everything as shipped production code.

Do not audit or delete contents of `node_modules/`, `dist/`, caches, or generated artifacts. Do not remove a static asset solely because it has no TypeScript import: check CSS URLs, HTML, Vite `new URL`/glob imports, and runtime asset registries. Treat vendored data and authored content as data, not code, unless their consumers are proven absent.

## Instructions for the Audit Agent

The agent must work conservatively and keep an evidence ledger. Do not make broad rewrites, rename APIs, change game rules, remove dependencies, or delete multiple candidates in one batch. Do not commit. Preserve all pre-existing worktree changes. If evidence conflicts or a candidate may be an intentional public contract, mark it **Unresolved** and report it instead of guessing.

### Step 1: Establish the baseline

1. Run `git status --short --branch` and record the current branch and every pre-existing change. Never overwrite or revert those changes.
2. Read `.kilo/AGENTS.md`, `.kilo/commands/design.md`, `README.md`, `package.json`, TypeScript configs, Vite config, and the CI workflow. Use their current contents; do not rely on old notes in this plan.
3. Record the current results of `npm run lint`, `npm run typecheck`, `npm run test:once`, `npm run test:coverage`, `npm run build`, and `npm run check`. If a command fails, record its exact failure and whether it is baseline or introduced. Do not repair unrelated failures as part of this audit.

### Step 2: List the real entry points

Create an entry-point map before searching for dead files. At minimum inspect:

- Browser app: `index.html`, `Source/App/main.tsx`, the root app, hash routes, and screens.
- Server: `Server/Relay.ts` and the server's own `package.json` scripts.
- Tests and performance harnesses: Vitest config, `Tests/`, browser tests, and test-only helpers.
- Development tooling: root and nested npm scripts, `Tools/Cli`, tool entry files, and scripts called by those wrappers.
- Build and CI: Vite config, TypeScript configs/project references, ESLint config, Prettier config, Playwright config, GitHub Actions, and any package lifecycle scripts.
- Dynamic app registrations: `import.meta.glob`, computed imports, route tables, barrel exports, plugin/rule registration, CSS-module `composes`, string-keyed registries, event/protocol discriminants, browser storage keys, and runtime asset paths.

Do not infer that a module is unused because it is not imported directly by `main.tsx`. Trace its import chain and check whether it is invoked by a route, registry, build tool, test runner, CLI, or external contract.

### Step 3: Search candidates systematically

For each suspicious symbol or file:

1. Search the exact, case-sensitive identifier with `git grep -n -w Symbol -- Source Server Tests Tools` (adjust folders for the candidate). Search the file basename and exported names separately.
2. Inspect barrel files (`index.ts`) and aliases/exports. A symbol may be re-exported even if consumers use only the barrel path.
3. Use VS Code **Find All References** for TypeScript symbols and compare it with the text search. If the language service cannot resolve a case, record that limitation.
4. Search string-based lookups, serialized names, reflection-like access, `import.meta.glob`, CSS module names, and generated file paths. Static symbol references do not find these.
5. For dependencies, check imports and `package.json` scripts/configuration (`npm explain package-name`, repository search, build/test configs). Do not remove a package just because production code does not import it; it may be a build, test, lint, or CLI dependency.
6. If history could clarify a placeholder or migration, use `git log -S'Symbol' --all -- path` and inspect the relevant change. History is evidence, not proof of present usage.

### Step 4: Classify each finding

Every finding must go into the ledger below with one status:

- **Used**: identify the concrete caller or entry path.
- **Confirmed unused internally**: exact-reference search and language references show no consumer, and every relevant dynamic/external entry point was checked.
- **Redundant**: identify the existing implementation with the same responsibility and show equivalent behavior, including edge cases.
- **Stale wording**: cite the implementation that contradicts the comment/document.
- **Unresolved**: name the missing evidence and the risk that prevents deletion.

Never convert **Unresolved** to **Confirmed unused** simply to make the ledger look complete. Record intentional exclusions and why they cannot be statically traced.

### Step 5: Resolve the known leads

1. **`GroupId`**: repeat the exact search; inspect the `Core` barrel and `package.json` package metadata. Since this repository is an application and the exact alias has no internal consumer, remove only `export type GroupId = string` if no public API promise is found. Do not change any numeric `groupId` fields, indexes, protocol messages, storage formats, or tests to strings. Re-run lint, typecheck, tests, and build immediately after this small edit.
2. **Letter pairs**: leave `LetterPairs`, `lettersOf`, `draftCarries`, and the letter-enchantment path in place. Record their call chain. Do not confuse letter constraints in game answers with room-code or group-ID generation.
3. **Room codes**: preserve numeric code generation and its digit validation tests. If the audit edits the stale "letter" comments, make a wording-only change and run the focused RoomCode/Routes tests plus lint.
4. **Client identity and seeded randomness**: preserve `ClientIdentity.randomId` and `randomFor` unless separate evidence proves a specific path unused. Their formats and responsibilities differ from room codes and numeric group indexes.

### Step 6: Check for true duplication

For each pair alleged to duplicate:

1. Write down what each implementation owns and who calls it.
2. Compare accepted inputs, returned shapes, errors/fallbacks, side effects, timing, deterministic behavior, persistence/wire format, and UI/API contracts.
3. Read the neighboring tests and add a focused regression assertion before consolidating if an observable behavior could change.
4. Merge only if one implementation can replace the other without a caller-specific distinction. Otherwise classify them as separate responsibilities and explain the difference.

Do not consolidate layered hooks/components just because they share similar names. In this application, a hook may adapt state while a view formats it and a component renders it; those are not automatically duplicate implementations.

### Step 7: Make only evidence-backed edits

- Work on one confirmed candidate at a time. State the evidence and expected effect before editing.
- Prefer deleting a truly unused declaration or file over adding a compatibility wrapper or another abstraction.
- Do not add tests whose only purpose is to inflate coverage. For dead-code deletion, verify no caller and verify the build/typecheck. For behavioral consolidation, tests must assert the preserved behavior.
- Do not add coverage ignores or widen exclusions to improve percentages.
- After each code edit, run the cheapest focused check immediately. Then run the relevant broader checks before moving to the next candidate.
- Stop and report if a deletion requires changing game/network behavior, wire/storage formats, public API promises, or design-system conventions not explicitly authorized by this plan.

### Step 8: Final validation and handoff

Run `npm run check` and separately inspect `npm run test:coverage` if the check does not include coverage. Confirm the production build, server/tool entry points, and any affected browser workflow. Review `git diff --check`, the full diff, and `git status`; ensure no unrelated or generated changes are included.

The handoff must include:

- A summary of removed symbols/files/packages and the evidence for each.
- A list of candidates retained as used, with their concrete entry paths.
- A list of unresolved candidates and exactly what evidence is missing.
- Tests/checks run and their outcomes; distinguish baseline failures from new failures.
- Current line/branch/function coverage, clearly labeled as test coverage, not "usage percentage."
- Any stale documentation corrected and any intentional scope exclusions.

## Candidate Ledger

| Candidate                               | Kind                    | Evidence searched                                              | Dynamic/external paths checked                 | Status                                 | Action and focused validation                                                  |
| --------------------------------------- | ----------------------- | -------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `Source/Core/Types.ts: GroupId`         | Unused type alias       | Exact `git grep`; VS Code references; barrel; package metadata | App has no `exports` field — not a library API | **Confirmed unused internally**        | Removed `export type GroupId = string`; lint, typecheck, tests, build all pass |
| `Source/Core/LetterPairs.ts`            | False-positive check    | `ThemeModifiers`, effect-label and writing-demand call chains  | Enchantment resolution and UI rendering        | Used; retain                           | Existing focused tests                                                         |
| `Source/App/RoomCode.ts` letter wording | Stale-comment candidate | Numeric alphabet, normalizer, route validation, tests          | User input and copied room links               | Behavior is numeric; wording corrected | "room letter" → "room digit"; RoomCode/Routes tests and lint pass              |
| `Source/App/Routes.ts` "five letter"    | Stale-comment candidate | Numeric room codes, route validation                           | User input and copied room links               | Behavior is numeric; wording corrected | "five letter path" → "five-digit path"; Routes test and lint pass              |
| `Source/Network/ClientIdentity.ts`      | False-positive check    | `ClientSession` call chain                                     | Browser identity persistence and session use   | Used; retain                           | Existing focused tests                                                         |
| `Source/Core/Random.ts`                 | False-positive check    | Game deal call chains                                          | Deterministic seeded randomness                | Used; retain                           | Existing focused tests                                                         |

## Completion Criteria

- Every repository candidate is classified with evidence; unresolved cases remain visibly unresolved.
- Every deletion is supported by reference, entry-point, and contract checks; no feature is removed based only on naming, a single grep, or low coverage.
- The `GroupId` alias was removed with the stated checks; no numeric `groupId` fields, indexes, protocol messages, storage formats, or tests were changed to strings.
- Stale "letter" wording in `RoomCode.ts` and `Routes.ts` was corrected to "digit"/"five-digit" without changing behavior.
- The active letter-pair mechanics (`LetterPairs`) and numeric room-code path (`RoomCode`) were not mistaken for one another.
- No changes alter game behavior, network/storage formats, rendering contracts, or public package behavior without explicit authorization.
- Required validation results are recorded and the final handoff contains the ledger and residual risks.

## Final Validation

`npm run check` passes all 8 steps: format, lint (0 errors), typecheck (0 errors), comments (0 issues), tests (1396 passed, 3 skipped), build (549 modules).

Coverage (test coverage, not usage percentage): 64.27% lines, 53.2% branches, 59.54% functions. Gate: 63%/52%/58% — passes. The 100% executable-line target remains deferred as a follow-up phase.

## Changes Made

1. **Removed** `export type GroupId = string` from `Source/Core/Types.ts` — unused type alias, no internal consumer, app has no `exports` field (not a library API).
2. **Corrected** `Source/App/RoomCode.ts` comment: "room letter" → "room digit" — stale wording, behavior unchanged (numeric alphabet).
3. **Corrected** `Source/App/Routes.ts` comment: "five letter path" → "five-digit path" — stale wording, behavior unchanged (numeric codes).

## Candidates Retained (Used)

- `Source/Core/LetterPairs.ts` — used by `ThemeModifiers`, effect labels, writing-demand path
- `Source/Network/ClientIdentity.ts` — used by `ClientSession` for browser identity
- `Source/Core/Random.ts` — used for deterministic seeded game randomness
- All other files — verified used via entry-point map

## Unresolved Candidates

None. All candidates classified with evidence.

## Relationship to 100% Coverage

The existing 63%/52%/58% coverage thresholds are an interim regression floor, not proof that all code is used. Reaching 100% executable-line coverage remains a separate follow-up and requires tests for meaningful behavior, not merely invoking every line. This audit's completion is based on classifying repository code usage and redundancy, not on reaching a coverage percentage.
