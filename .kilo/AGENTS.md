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

# ARCHITECTURE: MODULES AND DEPENDENCY DIRECTION
```
Source/
  Core/        Base types (PlayerId, GroupId), Result, assertNever. Depends on nothing.
  Content/     Topics.ts (topic bank), Strings.ts (all UI text).
  Game/        PURE logic: phases, reducer, scoring, normalization, GameConfig.
  Network/     Transport (interface), TrysteroTransport, InMemoryTransport, Protocol, HostSession, ClientSession.
  Design/      Tokens/, Primitives/, Components/. Knows nothing about Game and Network.
  Screens/     JoinScreen, LobbyScreen, WritingScreen, ReviewScreen, ScoresScreen, FinalScreen. Receive data ONLY via props.
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
camelCase: variables, parameters, functions, props, object fields. Hooks are `useXxx` (hooks rule).
Naming rules enforced by linter (`@typescript-eslint/naming-convention` + `eslint-plugin-check-file`). Red lint = stage not done.

# DESIGN SYSTEM "LIKE IN FIGMA"
1. **Tokens = Figma variables.** Single source: `Design/Tokens/Tokens.json` in DTCG format (`$type`, `$value`). Two layers:
   - Primitive: raw values (`Color.Blue.500`, `Space.4`, `Radius.2`, `FontSize.3`).
   - Semantic: meaning (`Color.Surface.Default`, `Color.Text.Muted`, `Color.Action.Primary.Background`, `Space.Gap.Md`), references Primitive.
   Components use ONLY Semantic. Script `npm run tokens` generates `Tokens.css` (runs in `predev` and `prebuild`, file in `.gitignore`, not edited by hand). Themes: `Tokens.Dark.json` overrides Semantic layer only.
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
- Routing: hash (`#/Join/ABCD`, `#/Gallery`), because GitHub Pages does not SPA path rewriting.
- Out of v1 scope (do not implement, only do not block): player reconnect, host migration. If host leaves, show "Host left" screen.

# GAME LOGIC
- Entire `Game/` module is pure functions, no DOM, no `Date.now`, no `Math.random` without injection, no network, no timers.
- Normalization: lowercase, `ё`→`е`, remove punctuation and extra spaces. Grouping: Levenshtein ≤1 for words ≥5 chars (exact match for short) plus stripping typical Russian endings.
- Group rejection: "not suitable" votes strictly > half of players, excluding group authors.
- Every function in `Game/` covered by Vitest tests: `normalizeAnswer`, `groupAnswers`, `calculateRoundScores`, phase reducer, `toPublicState`.

# HARD PROHIBITIONS
1. No `any`, no `as` (except `as const`), no `!` (non-null), no `@ts-ignore`.
2. No hex colors, `px` spacing, or font names outside `Tokens.json`. No `style={{}}`.
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
  | { type: "RejectGroup"; groupId: GroupId }
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
- **Stage 1. Design system:** `Tokens.json`, Primitives, Components with `Gallery` files, `#/Gallery` page. Verified in gallery, no game logic yet.
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
- Changing a value in `Tokens.json` changes appearance of whole app without editing components.
- Changing `Tokens.Dark.json` gives dark theme without editing components.
- Replacing `TrysteroTransport` with another `Transport` requires no edits outside `Network/` and `App/`.
- Game on `InMemoryTransport` can be played from Lobby to Final in a test.
- No prohibition from "Hard Prohibitions" section violated.