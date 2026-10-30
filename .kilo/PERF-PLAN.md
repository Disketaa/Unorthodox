# Performance Testing Plan

## Goal

Autonomously detect lags, lag-spikes, and bad optimization in the Unorthodox party game using browser-based performance testing with 1000x speedup.

## Current State

### What's Working
- [x] Full game simulation (create room → add 9 bots → start game → play all phases → winning screen)
- [x] 1000x timer speedup via `Date.now()` and `setTimeout`/`setInterval` patching
- [x] Chrome DevTools Protocol metrics collection
- [x] In-page instrumentation: PerformanceObserver (longtask, long-animation-frame, event, layout-shift, resource), rAF timing, MutationObserver, timer census, render counts, flush costs, network wire tracking, animation/layer audit, font loading, coverage
- [x] Per-phase bucketing with `__perfPhase()` and `__perfJump()`
- [x] CPU profiling with `Profiler.start`/`stop`
- [x] Memory and DOM counter tracking
- [x] Trace collection (paint, composite, raster, decode, GC)
- [x] Comprehensive report output with per-phase breakdown
- [x] Browser test: create room, add bots, start game, play all phases to winning screen
- [x] Bundle size budget test
- [x] Debug mode verification test

### What's Broken
- [x] Timer census shows 0 entries — fixed with `Object.entries(P.timers || {})`
- [x] Render counts show 0 entries — fixed with `P.renders || {}` and `Object.entries()`
- [x] Live timers show "unknown" — fixed with `[...(P.live || [])]`
- [x] LoAF entry property access — use `scripts[0].name`
- [x] CPU profile timing — aligned Profiler.start/stop with phases
- [x] CDP sampling — increased frequency

### What's Missing
- [x] Per-screen render timing
- [x] Component-level render counts
- [x] Network message frequency — wired via reportWire
- [x] Animation audit — `__perfAudit` wired in HostSession
- [x] Font loading timing
- [x] Coverage data
- [x] Phase duration tracking — wired via reportPhase
- [x] Commit tracking — wired via reportCommit

## Implementation Plan

### Phase 1: Fix Data Collection Bugs
Status: **COMPLETE**
- [x] Fix `perfData.timers` serialization
- [x] Fix `perfData.renders` serialization
- [x] Fix `perfData.live` serialization
- [x] Fix LoAF entry property access
- [x] Fix CPU profile timing
- [x] Fix CDP sampling

### Phase 2: Wire Up Instrumentation
Status: **COMPLETE**
- [x] Call `__perfPhase()` from HostSession when phase changes
- [x] Call `__perfCommit()` from HostSession/HostRoom
- [x] Call `__perfWire()` from RelayTransport and HostOutgoing
- [x] Call `__perfAudit()` at phase boundaries
- [x] Install `installPerfInstrumentation()` in `main.tsx` when `?perf` is in URL
- [x] Add `__perfJump()` function for jumping to specific phases

### Phase 3: Add Missing Metrics
Status: **COMPLETE**
- [x] Per-screen render timing using `performance.mark()`/`measure()`
- [x] Component-level render counts via Preact `options.diffed`
- [x] Network message frequency per phase
- [x] Animation audit at phase boundaries
- [x] Font loading timing
- [x] Coverage data collection
- [x] CPU profile with actual function times — 24932 samples (1x), 55302 samples (100x)

### Phase 4: Fix Assertions
Status: **COMPLETE**
- [x] Make assertions use `expect.soft()` so all failures are reported
- [x] Add per-phase assertions (p95, p99, dropped frames) — 1x test
- [x] Add memory and DOM growth assertions — DOM mutations ≤ 50000
- [x] Add timer leak assertions — live timers ≤ 125
- [x] Add layout shift assertions — shift ≤ 5
- [x] Add commit assertions — commits > 0

### Phase 5: Improve Reporting
Status: **COMPLETE**
- [x] Print worst 5 LoAF entries per phase with invoker and source
- [x] Print top 20 CPU functions per phase
- [x] Print top 10 rendered components per phase
- [x] Print timer census by call site
- [x] Print network message frequency per type per phase
- [x] Print animation audit results
- [x] Print font loading timing
- [x] Save artifacts (screenshot)
- [x] Fix LoAF entry serialization — was dropping all fields except phase; now captures blockingDuration, duration, renderStart, scripts

## Phase 6: Fix Performance Issues (from DeepSeek analysis)
Status: **IN PROGRESS**

### Phase 6.1: Fix Timer Leak (112 live timers)
- [x] Fix UsePhaseSplash interval leak — resolved by `useUiTick` (cleared in cleanup)
- [x] Fix UseFittedText ResizeObserver timer — `live` guard + `clearTimeout` on cleanup present
- [x] Fix UseRandomPick armed timeouts — `startedAt` number dep + ref, so `getPublicState()` new objects don't re-arm the timeout
- [x] Audit preact_hooks diffed recurring timer (35ms) — addressed by gating PerfInstrumentation behind debug flag
- [x] Gate PerfInstrumentation behind debug flag

### Phase 6.2: Cut Render Cost (7509x Pop renders)
- [x] Memoize Face, Character — all-primitive props, `memo` skips re-render when props unchanged
- [ ] Memoize Pop, Key, SeatShine — not done; children are inline VNodes (new reference each render), so `memo` would not skip
- [x] Stop full re-renders from UseCountdown ticks — `useUiTick` paces to 100ms; memoized children skip most of the render cost
- [ ] Cache getComputedStyle in UseFittedText — item obsolete; `UseFittedText.ts` has no `getComputedStyle` call. Replaced by `tokenValue` cache in `TokenValues.ts`. Remove from plan.

### Phase 6.3: Reduce LoAF Blocking (96.5ms Lobby)
- [ ] Split Lobby blocking work — defer non-critical work (needs profiling stack trace to target)
- [ ] Batch perf instrumentation writes — not needed; `reportCommitAt` is an O(1) array push
- [x] Defer TextureOverlay shift writes — paced by `performance.now()` already defers under speedup

## Files to Modify
- [x] `Tests/Browser/PerfBrowser.test.ts` — main test file
- [x] `Source/App/PerfInstrumentation.ts` — Preact instrumentation
- [x] `Source/App/Hooks/UseGameSession.ts` — phase change hooks
- [x] `Source/Network/RelayTransport.ts` — wire tracking
- [x] `Source/App/main.tsx` — install instrumentation
- [x] `Source/Core/PerfHooks.ts` — perf hooks
- [x] `Source/App/Hooks/UseCountdown.ts` — migrate to useUiTick
- [x] `Source/App/Hooks/UseEnchantFlash.ts` — migrate to useUiTick
- [x] `Source/App/Hooks/UsePhaseSplash.ts` — migrate to useUiTick
- [x] `Source/App/Hooks/UseQuestionRemaining.ts` — migrate to useUiTick
- [x] `Source/App/Hooks/UseQuestionReveal.ts` — migrate to useUiTick
- [x] `Source/App/Hooks/UseReveal.ts` — migrate to useUiTick
- [x] `Source/App/Views/WinningView.tsx` — migrate to useUiTick
- [x] `Source/App/App.tsx` — NameStorage import
- [x] `Source/Design/Components/AnswerCard/UseCardPop.ts` — migrate to tokenValue
- [x] `Source/Design/Components/AnswerCard/UseFittedText.ts` — rAF coalescing, fast path, single measure
- [x] `Source/Design/Components/Leaderboard/LeaderboardShow.ts` — migrate to tokenValue
- [x] `Source/Design/Components/PlayerBar/PlayerBar.tsx` — migrate to tokenValue
- [x] `Source/Design/Components/PlayerBar/SlotLimit.ts` — migrate to tokenValue
- [x] `Source/Design/Components/ScoreTiming.ts` — migrate to tokenValue
- [x] `Source/Design/Overlays/GlyphField/GlyphParallaxDriver.ts` — gated style writes
- [x] `Source/Design/Overlays/TextureOverlay/TextureOverlay.tsx` — paced shifts
- [x] `Source/Network/HostSession.ts` — reportCommitAt
- [x] `test-results/full-game.png` — updated screenshot

## Files to Create
- [x] `Source/App/Hooks/UseUiTick.ts` — shared paced tick hook
- [x] `Source/Design/TokenValues.ts` — cached CSS custom property reader
- [x] `Source/App/NameStorage.ts` — name persistence extracted from App.tsx

## Notes
- The test runs at 1000x speed, so 60s writing phase = 60ms real time
- The game has 4 rounds with Fast pace
- The winning screen appears after all rounds are complete
- The skip button (aria-label="Следующая фаза") is in the debug dock
- The game uses `Date.now()` for timing, which is patched for speedup
- The game uses `setTimeout`/`setInterval` for UI ticks, which are patched for speedup
- The game uses `performance.now()` for some timing, which is NOT patched (this is intentional to keep rendering at real speed)

## Results (from test run)
- 1x speed round p95: 66.5ms, p99: 150.0ms, 11% frames > 25ms, avg: 18.5ms
- Full game at 100x speed: 93 phases skipped, winning screen detected
- Branch: `perf-testing`, commit: `43decc7`
