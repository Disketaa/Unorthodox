# ROLE
Senior frontend engineer. Build a browser-based party game in Jackbox style. Code will be read and edited by humans and other AI agents, so predictability beats creativity.
Do not improvise beyond this document. If something is missing, pick the simplest solution, record it in one line in `DECISIONS.md`, and continue.

# PRODUCT
- 3–10 players. All open one site (GitHub Pages) and see the same interface. No separate host screen.
- Room creator is the "host". Their browser owns game state and broadcasts it to others. Their UI is the same as everyone else's, plus a "Start" button.
- Cycle: Lobby → Writing (topic, 60s, input field) → Reviewing (answers open simultaneously, duplicates grouped, players can reject) → Scores → next round → Final.
- Scoring: 1 unique answer → 3 points, 2 → 1, 3+ → 0. Rejected group → 0. All numbers live ONLY in `GameConfig`.
- No backend. Static only.

# STACK (fixed)
Vite, TypeScript (strict), Preact, CSS Modules, Vitest, ESLint, Prettier, Trystero.
No UI libraries, Tailwind, CSS-in-JS, state managers. New dependency only with entry in `DECISIONS.md` and reason.
Before writing network adapter, read current Trystero docs (pin exact version, no `^`). Do not write its API from memory.

# COMMANDS
`Tools\Cli` is on the PATH: `uq` runs from any directory in a fresh terminal and calls the npm
scripts, so it is a shortcut and not a second toolchain. Use the narrow form while working and the
wide one before handing over.

- `uq lint [paths...]` — ESLint, one path or the whole repo. `uq fix` for `--fix`, which also runs
  Prettier over the stylesheets: the two own disjoint files and neither reads the other's.
- `uq tc [path]` — `tsc` for `Source`, `Tools` or `Tests` alone; no path runs all three.
- `uq t` — tests RELATED to uncommitted changes (`vitest related`). `uq t <filter>` for one suite.
  `uq ta` is the full 936-test run, and `uq check` is `npm run check` in full.
- `uq cm` / `uq cf` — comment audit / rewrite comments to the canonical shape.

A changed `.css` also runs the `Tests/` suites: they read stylesheets with `node:fs` rather than
importing them, so the import graph alone would report no tests for a token change.

**Every file ends with exactly one newline**, and no two blank lines ever sit together. The
newline is `eol-last` in ESLint for code and the `eof` verdict in the CSS audit, so `uq fix`
supplies it. Prettier emits a final newline unconditionally, so this agrees with the formatter
rather than ruling against it. Blank lines are not linted: nothing in the tree has two.

**Text is UTF-8, and text that was decoded twice is rejected.** `encoding/no-mojibake` in ESLint
and the `mojibake` verdict in the CSS audit share one signature list in
`Tools/Encoding/Mojibake.mjs`: U+FFFD, a Cyrillic U+0432 followed by U+0402, a Latin U+00E2 followed
by U+20AC, and U+00C3. U+0420 and U+0421 are excluded on purpose — the repo is written in Russian, so
they cannot be told from ordinary words. Never write a signature out literally, even in a comment or
a doc: that puts the damage in the file explaining it. `DECISIONS.md` and `README.md` pass through
no gate, so re-read them after any tool touches them.

# ARCHITECTURE: MODULES AND DEPENDENCY DIRECTION
```
Source/
  Core/        Base types (PlayerId, GroupId), Result, assertNever. Depends on nothing.
  Content/     Topics.ts (topic bank), Strings.ts (all UI text).
  Game/        PURE logic: phases, reducer, scoring, normalization, GameConfig.
  Network/     Transport (interface), TrysteroTransport, InMemoryTransport, Protocol, HostSession, ClientSession.
  Design/      Tokens.css, Primitives/, Components/. Knows nothing about Game and Network.
  Screens/     JoinScreen, LobbyScreen, WritingScreen, ReviewScreen, ScoresScreen, FinalScreen, HostLeftScreen. Receive data ONLY via props.
               Screens may hold local UI state only inside a sub-component (e.g. the answer draft in `AnswerInput`), never game state.
  App/         Assembly: providers, hooks (useGameSession, useCountdown), routing. Only place where everything meets.
  Dev/         ComponentGallery.
```
Allowed imports (everything else forbidden, enforced by ESLint `no-restricted-imports` via folder overrides):
- Core → nothing
- Content → Core
- Game → Core (texts/themes passed as arguments, Game does not import them)
- Network → Core, Game (types only)
- Design → Core
- Screens → Core, Design, Content, Game types
- App → everything
Cross-module imports go through `index.ts` only (`@/Game`), not deep (`@/Game/internal/...`).

# NAMING
PascalCase: code files/folders, components, types, interfaces (no `I` prefix), classes, enum members, constant objects (`GameConfig`, `Strings`), variant values (`"Primary"`), message `type` values (`"SubmitAnswer"`), CSS classes in modules (`.Root`, `.VariantPrimary`), tokens (`Color.Surface.Default` → `--Color-Surface-Default`).
camelCase: variables, parameters, functions, props, object fields. Hooks are `useXxx` (hooks rule), but the file that holds a hook is PascalCase (`UseGameSession.ts`), because the linter's `check-file/filename-naming-convention` is PASCAL_CASE for every file under `Source/`.
Naming rules enforced by linter (`@typescript-eslint/naming-convention` + `eslint-plugin-check-file`). Red lint = stage not done.

# DESIGN SYSTEM "LIKE IN FIGMA"
1. **Tokens = Figma variables.** Single source: `Design/Tokens.css`, one `--Token-Name` per line, split into a primitive layer (raw values, e.g. `--Color-Blue-500`, `--Space-4`) and a semantic layer (meaning, e.g. `--Color-Surface-Default`), where semantic tokens reference primitives with `var()`. There is no `Tokens.json` and no generator script: the file is hand-written and committed. Components use ONLY semantic tokens. Adding a token means adding a line to `Tokens.css` first, then using it. Themes are not implemented in v1.
2. **Primitives = Auto Layout / Frame:** `Box`, `Stack` (direction, gap, align, justify; gap only `"Xs" | "Sm" | "Md" | "Lg" | "Xl"`), `Text` (variant: `"Title" | "Body" | "Caption" | "Mono"`), `Spacer`.
3. **Components = Components + Variants:** Button, TextField, Card, PlayerChip, RoomCodeBadge, Timer, AnswerCard, VoteButton, ScoreRow, Banner.
   - One folder per component: `X.tsx`, `X.module.css`, `X.Gallery.tsx`, `index.ts`.
   - Variants via props `variant`, `size` and booleans `disabled` / `loading`. Values are union types in PascalCase.
   - Closed API: components do NOT accept `className` or `style`. Appearance changed only via tokens or new variant inside component.
4. **Screens** assembled only from Primitives and Components. No own colors, spacing, fonts in `Screens/`, only composition.
5. **Gallery** `#/Gallery` (`Dev/ComponentGallery`) collects all `*.Gallery.tsx` via `import.meta.glob`, shows each component in all variants (like Figma components page). New component without `Gallery` file = unfinished.
6. Mobile-first: `dvh` instead of `vh`, font size in inputs ≥16px, touch targets ≥44px, `:focus-visible` states described by tokens.

# NETWORK AND PROTOCOL
- All network hidden behind `Transport` interface: `sendToHost`, `sendToPlayer`, `broadcast`, `onMessage`, `onPeerLeave`. Implementations: `TrysteroTransport` (only place `trystero` is imported) and `InMemoryTransport` (for whole-game tests without network).
- Messages are discriminated unions (`ClientMessage`, `HostMessage`) in `Network/Protocol.ts`. Every incoming message passes type guard. Invalid silently discarded.
- Host is authoritative. `HostGameState` (with all answers) never leaves host. Outside goes only `PublicGameState`, assembled by `toPublicState` per phase. In Writing, clients see only `submittedCount`, answers only in Reviewing.
- Time: host sends `{ phase: "Writing", durationMs }` once. Client records `performance.now()` on receipt and counts remainder locally (device clocks not synced). Host closes phase by its timer and accepts late answers until `GameConfig.timing.graceMs`.
- Player input: name ≤16 chars, answer ≤80, all trimmed. User text rendered as text only, `dangerouslySetInnerHTML` forbidden.
- Room code: 4 letters, no lookalikes (no O/0, I/1). Also Trystero room name. `appId` unique to project, lives in constant.
- Group ids are plain `number`s end to end (they are indices into the grouped answer list). The `GroupId` string type in `Core/Types.ts` is unused and exists only as a placeholder.
- Routing: hash (`#/Join/ABCD`, `#/Gallery`), because GitHub Pages does not SPA path rewriting.
- Out of v1 scope (do not implement, only do not block): player reconnect, host migration. If host leaves, show "Host left" screen.

# GAME LOGIC
- Entire `Game/` module is pure functions, no DOM, no `Date.now`, no `Math.random` without injection, no network, no timers.
- Normalization: lowercase, `ё`→`е`, remove punctuation and extra spaces. Grouping: Levenshtein ≤1 for words ≥5 chars (exact match for short) plus stripping typical Russian endings.
- Group rejection: a group is rejected when "not suitable" votes are strictly more than half of that group's own authors. (The earlier wording — majority of all players — was a spec change that was never implemented; the reducer in `Game/GameActions.ts` is the source of truth.)
- Every function in `Game/` covered by Vitest tests: `normalizeAnswer`, `groupAnswers`, `calculateRoundScores`, phase reducer, `toPublicState`.

# COMMENTS
Three forms, and which one to use is not a matter of taste.

- `/** ... */` on a declaration: a function, class, type, interface, field, constant. It is
  the only form a tool shows on hover, so anything a symbol needs saying goes here.
- `//` on a statement. Nothing to attach a docstring to, so nothing to reach for the doc
  form. A run of `//` lines is one comment.
- `/* ... */` in CSS only, and `{/* ... */}` inside JSX. There is no declaration in a
  stylesheet to attach a docstring to. `/* eslint-disable */` is tool syntax, exempt from
  all of this.

A bare `/* ... */` inside a function body is wrong in `.ts` and `.tsx`: that is a statement
comment and takes `//`. Only two exceptions exist today, both forced: the eslint directives in
`Core/Logger.ts`, and JSX braces.

**Three content lines is the budget**, counted excluding the delimiters. Tests are exempt, since an
expectation table with a note per row is the clearest form there. A comment needing a fourth line
is too long: shorten it or delete it.

**Two shapes for a doc comment, decided by width and not by taste.** Prose that fits on one line
is one line, delimiters included. Anything longer is a gutter block at the 96-column print width,
with the opening delimiter riding on the first line of prose and the closing one on the last, and
no gutter line ever left blank. Never pad a short comment out to a block — six physical lines
around three lines of prose says nothing and reads as ceremony.

```ts
/** Its place in a row, so a row of reactions ripples instead of firing in unison. */
trigger: string | number | undefined;

/** This player's own character, as the host has it.
 * Not the roll made on this device: a returning player is given the character the host kept,
 * so the picker shows what the rest of the room actually sees. */
ownLook: PlayerLook | undefined;
```

Do not write the shape by hand. `npm run comments:format` rewrites every block comment in the tree
to the canonical shape and `npm run comments:format:check` fails when one is off it; both run inside
`npm run check`. The shape is defined once, in `Tools/Comments/CommentShape.mjs`, and the ESLint rule and
the audit both import it — a formatter that disagreed with its own linter would be worse than none.
Two notes on what it will not touch: a `//` comment, since it has no closing delimiter to reflow
around, and a trailing comment, which has no indent and is reported by `comments/no-trailing` instead.

A gutter block stays a real doc comment, not a run of `//` lines: only a doc comment attaches to a
declaration in TypeScript and in every LSP that reads it, so `//` above a function means no hover
text and no IntelliSense. Inside a function body there is no declaration to document, which is why
that scope takes `//` instead.

**The delimiter is fixed per language.** `/**` in TypeScript, JS and MJS; `/*` in CSS. This is one
rule applied consistently rather than two dialects, and it is not interchangeable: `/**` is what
attaches to a declaration and carries the hover text, while `/**` in a stylesheet is only a comment
that happens to have an extra star, since no language reads a declaration out of CSS. Plain `/*` in a
TypeScript file is rejected outright by `comments/no-block-in-ts`, the sole exception being an
`eslint-disable` directive, which has to be a comment of its own.

**One comment, not two.** A comment separated from the next by nothing but a blank line is the same
comment cut in two, and permitting that turns the budget into a suggestion: the cursor block in
`Tokens.css` was sixteen lines of prose cut into three six-line notes, the rule was satisfied, and
nothing had been shortened. Rejected by `comments/no-split` and by the `split` verdict in the CSS
audit, and the pair counts once against the budget. The case that looks like an exception is a file
header followed by the first declaration's own comment: those are two subjects, so both stay and the
header goes above the imports where a file header belongs. A trailing comment is also exempt, since
`comments/no-trailing` already reports the placement.

**A trailing comment is banned everywhere**, in every file type including CSS. It cannot be wrapped:
the prose is squeezed into whatever the code left, so it ends up short, and a short note saying what
the code beside it plainly says is exactly what this policy exists to remove.

Enforced by `npm run lint` and `npm run comments -- --css`, not by eye: `comments/max-lines` for the
budget, `comments/shape` for the two shapes, `comments/no-trailing`, `comments/no-block-in-ts`,
`comments/no-split`, and `comments/form` for scope. All report one message: *Comment only if the
code cannot explain itself.* CSS is not linted by ESLint, so the audit owns its own budget of six
content lines — higher than TypeScript's three, because a comment in a stylesheet is the
specification and a token scale has no name or type to explain itself through.

**A comment earns its place only by saying something the code cannot.** Allowed: why this
approach and not the obvious one, a constraint that would otherwise be "tidied" away, a rule
the shape of the data does not reveal, a failure mode that was found by using the thing.

Four kinds are banned. The first three are found by `npm run lint` or `npm run comments`; the
fourth is a matter of judgment and is why every finding must be disposed of by hand:

1. **Restatement.** `/** Stop the host session */` above `stop()`, `/* Padding */` above
   `.PaddingXs`, `@param` and `@returns` on a signature that already carries them. Delete.
   If the only reason to keep a comment is that the name could have been better, the answer is
   a better name.
2. **Narration.** `// Step 1: lowercase`, `// Initialize the matrix`, `// Find the group with
   count 2` above the `find(g => g.count === 2)`. Delete.
3. **Open questions.** A comment ending in a question mark, or hedging with "might", "could
   add", "not sure". These are not comments, they are unfinished thoughts, and an agent
   reading one either copies the uncertainty or treats it as a decision. Answer it where it
   stands, or move it to `DECISIONS.md` and answer it there.
4. **Trailing a line of code.** `const cost = a === b ? 0 : 1; // substitution` puts the note
   where it is easiest to miss and easiest to leave behind. Move it above, or delete it.

Deleting a comment is not always the right call. A docstring that disambiguates between two
similar fields (`scores` against `cumulativeScores`), or that records a rule the type system
cannot hold, is earning its place even when it repeats the name. The tool flags these too;
dispose of each finding by hand.

# HARD PROHIBITIONS
1. No `any`, no `as` (except `as const`), no `!` (non-null), no `@ts-ignore`.
2. No hex colors, `px` spacing, or font names outside `Tokens.css`. No `style={{}}`.
3. No user text strings in JSX or logic: only `Strings`.
4. No magic numbers in logic: only `GameConfig`.
5. One component = one file, file ≤150 lines, function ≤40. Split if more.
6. No game logic, scoring, or network in components.
7. `useEffect` not for derived values: if value comes from props, compute in render.
8. `setInterval` not source of truth for time, only for re-renders.
9. No `default export` (except Vite requirements), only named exports.
10. No duplicate components like `BigPrimaryButton`: that is a variant.
11. No `console.log`, commented code, or TODOs without number in `DECISIONS.md`.
12. No full file rewrites for small edits: point changes only.
13. No comment that restates the code, narrates it, or asks a question: see COMMENTS.

# EXAMPLES: BAD / GOOD

### 1. Naming
BAD:
```tsx
// round_screen.tsx
export function round_screen() { const Remaining_MS = 60000; }
```
GOOD:
```tsx
// Screens/Writing/WritingScreen.tsx
export function WritingScreen({ topic, remainingMs }: WritingScreenProps) { /* ... */ }
```

### 2. Styles
BAD:
```tsx
<button style={{ background: "#3b82f6", padding: 12, borderRadius: 8 }}>Start</button>
```
GOOD:
```tsx
<Button variant="Primary" size="Medium" onClick={onStart}>{Strings.lobby.startButton}</Button>
```
```css
/* Button.module.css */
.VariantPrimary {
  background: var(--Color-Action-Primary-Background);
  color: var(--Color-Action-Primary-Text);
}
.SizeMedium { padding: var(--Space-Sm) var(--Space-Md); }
```

### 3. Variants instead of copies
BAD:
```tsx
export function PrimaryButton() {}
export function BigPrimaryButton() {}
export function SecondaryButtonSmall() {}
```
GOOD:
```tsx
export type ButtonVariant = "Primary" | "Secondary" | "Ghost";
export type ButtonSize = "Small" | "Medium" | "Large";
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
}
export function Button({ variant = "Primary", size = "Medium", disabled = false, onClick, children }: ButtonProps) {
  const classes = `${styles.Root} ${styles[`Variant${variant}`]} ${styles[`Size${size}`]}`;
  return <button class={classes} disabled={disabled} onClick={onClick}>{children}</button>;
}
```

### 4. Layers: screen does not know about network
BAD:
```tsx
// LobbyScreen.tsx
import { joinRoom } from "trystero";
export function LobbyScreen() {
  const room = joinRoom({ appId: "quiz" }, "ABCD");
}
```
GOOD:
```tsx
export interface LobbyScreenProps {
  roomCode: string;
  players: readonly PublicPlayer[];
  canStart: boolean;
  onStart: () => void;
}
export function LobbyScreen({ roomCode, players, canStart, onStart }: LobbyScreenProps) {
  return (
    <Stack gap="Lg">
      <RoomCodeBadge code={roomCode} />
      <Stack gap="Sm">{players.map((p) => <PlayerChip key={p.id} name={p.name} />)}</Stack>
      {canStart && <Button variant="Primary" onClick={onStart}>{Strings.lobby.startButton}</Button>}
    </Stack>
  );
}
```

### 5. Messages
BAD:
```ts
send({ t: "a", d: text });
if (msg.t === "a") { answers.push(msg.d); }
```
GOOD:
```ts
// Network/Protocol.ts
export type ClientMessage =
  | { type: "Join"; name: string }
  | { type: "SubmitAnswer"; text: string }
  | { type: "RejectGroup"; groupId: number }
  | { type: "StartGame" };

export function isClientMessage(value: unknown): value is ClientMessage { /* check fields */ }

// HostSession.ts
if (!isClientMessage(raw)) return;
switch (raw.type) {
  case "Join": /* ... */ break;
  case "SubmitAnswer": /* ... */ break;
  case "RejectGroup": /* ... */ break;
  case "StartGame": /* ... */ break;
  default: assertNever(raw);
}
```

### 6. Scoring: pure function, not effect
BAD:
```tsx
// ScoresScreen.tsx
useEffect(() => {
  answers.forEach((a) => { if (count(a) === 1) setScore((s) => s + 3); });
}, [answers]);
```
GOOD:
```ts
// Game/Scoring.ts
function pointsForGroupSize(size: number): number {
  if (size === 1) return GameConfig.scoring.uniquePoints;
  if (size === 2) return GameConfig.scoring.pairPoints;
  return GameConfig.scoring.commonPoints;
}

export function calculateRoundScores(groups: readonly AnswerGroup[]): ReadonlyMap<PlayerId, number> {
  const scores = new Map<PlayerId, number>();
  for (const group of groups) {
    const points = group.isRejected ? 0 : pointsForGroupSize(group.playerIds.length);
    for (const id of group.playerIds) scores.set(id, points);
  }
  return scores;
}
```

### 7. Timer
BAD:
```tsx
const [seconds, setSeconds] = useState(60);
useEffect(() => { setInterval(() => setSeconds((s) => s - 1), 1000); }, []);
// and host also sends "N seconds left" every second
```
GOOD:
```ts
// App/Hooks/useCountdown.ts
// startedAt = performance.now() at moment of receiving phase message
export function useCountdown(durationMs: number, startedAt: number): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), GameConfig.timing.uiTickMs);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, durationMs - (now - startedAt));
}
```

### 8. Leak of others' answers
BAD:
```ts
broadcast({ type: "State", state: hostState }); // contains all answers, visible in DevTools
```
GOOD:
```ts
broadcast({ type: "State", state: toPublicState(hostState) });
// in Writing: { phase: "Writing", topic, durationMs, submittedCount }
// answers exist only in phase === "Reviewing"
```

### 9. Magic numbers and texts
BAD:
```ts
if (count === 1) return 3;
<p>Time is up!</p>
```
GOOD:
```ts
if (count === 1) return GameConfig.scoring.uniquePoints;
<Text variant="Body">{Strings.writing.timeUp}</Text>
```

### 10. Type strictness and imports
BAD:
```ts
import { norm } from "../../Game/internal/text/norm";
const p: any = players[id]!;
```
GOOD:
```ts
import { normalizeAnswer } from "@/Game";
const player = players.get(id);
if (!player) return err("PlayerNotFound");
```

# WORK ORDER
Work in stages. Stop at end of each stage and wait for "Next" command. Do not start next stage yourself.
- **Stage 0. Scaffold:** Vite + TS strict + Preact, alias `@/`, ESLint (naming, module boundaries), Prettier, Vitest, workflow `.github/workflows/deploy.yml` for GitHub Pages (`base` = `'/<REPO>/'`, source = GitHub Actions), `DECISIONS.md`.
- **Stage 1. Design system:** `Tokens.css`, Primitives, Components with `Gallery` files, `#/Gallery` page. Verified in gallery, no game logic yet.
- **Stage 2. Game:** types, `GameConfig`, normalization, grouping, scoring, phase reducer, `toPublicState`, tests.
- **Stage 3. Network:** `Transport`, `InMemoryTransport`, `Protocol` with guards, `HostSession`, `ClientSession`, integration test "host + 3 clients" on `InMemoryTransport`, then `TrysteroTransport`.
- **Stage 4. Screens and assembly:** Screens, `useGameSession`, `useCountdown`, hash routing, `Strings`, `Topics` (30 topics to start).
- **Stage 5. Release:** verify deploy on GitHub Pages, README 15 lines (how to run, how to change theme, how to add component).

# FORMAT OF ANSWER AT END OF EACH STAGE
1. Tree of created and changed files.
2. 3–5 lines of decisions made (duplicate in `DECISIONS.md`).
3. Verification commands (`npm run lint`, `npm test`, `npm run build`) and their results.
4. "Waiting for 'Next'".
Do not duplicate code in chat, it is already in files.

# DEFINITION OF DONE
- `lint`, `tsc --noEmit`, `test`, `build` pass with no warnings.
- Changing a value in `Tokens.css` changes appearance of whole app without editing components.
- Dark theme is out of v1 scope: there is no second token file, so "change the theme" currently means editing the semantic layer in `Tokens.css`.
- Replacing `TrysteroTransport` with another `Transport` requires no edits outside `Network/` and `App/`.
- Game on `InMemoryTransport` can be played from Lobby to Final in a test.
- No prohibition from "Hard Prohibitions" section violated.
