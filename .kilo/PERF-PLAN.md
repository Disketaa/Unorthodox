# Performance Testing Plan

## Goal

Autonomously detect lags, lag-spikes, and bad optimization in the Unorthodox party game using browser-based performance testing with 1000x speedup.

## Current State

### What's Working
- Full game simulation (create room → add 9 bots → start game → play all phases → winning screen)
- 1000x timer speedup via `Date.now()` and `setTimeout`/`setInterval` patching
- Chrome DevTools Protocol metrics collection
- In-page instrumentation: PerformanceObserver (longtask, long-animation-frame, event, layout-shift, resource), rAF timing, MutationObserver, timer census, render counts, flush costs, network wire tracking, animation/layer audit, font loading, coverage
- Per-phase bucketing with `__perfPhase()` and `__perfJump()`
- CPU profiling with `Profiler.start`/`stop`
- Memory and DOM counter tracking
- Trace collection (paint, composite, raster, decode, GC)
- Comprehensive report output with per-phase breakdown

### What's Broken
1. **Timer census shows 0 entries** — `perfData.timers` is an object but `Object.entries()` returns empty. The in-page `__perf` object's `timers` field is a `Record<string, number>` but the data collection via `page.evaluate()` may not serialize it properly.
2. **Render counts show 0 entries** — `perfData.renders` is `Record<string, Record<string, number>>` but shows empty. The `installPerfInstrumentation()` function in `PerfInstrumentation.ts` writes to `window.__perf.renders` but the in-page `__perf` object created in `addInitScript` may not have the `renders` field properly initialized.
3. **Live timers show "unknown"** — `perfData.live` is a `Set<number>` which doesn't serialize to an array via `page.evaluate()`. Need to convert to array.
4. **LoAF entries show `invoker=undefined` and `source=undefined`** — The `long-animation-frame` PerformanceObserver entries may not have `invoker` and `sourceFunctionName` properties in this Chrome version. Need to check the actual entry structure.
5. **CPU profile shows 0.0ms for all functions** — The profile sampling interval (200µs) may be too coarse, or the profile start/stop timing doesn't align with the game phases. Need to use `profileAnchorMs` correctly.
6. **Layout shift sum is 4.522** — This is high. Need to investigate which elements are shifting.
7. **DOM mutations: 42999** — Very high. Likely from the game's animated elements (GlyphField, character animations, etc.).
8. **Frame samples: 1** — Only 1 CDP frame sample collected. The sampling interval (250ms) may be too slow, or the `cdpSampling` flag is being set to false too early.

### What's Missing
1. **Per-screen render timing** — Need to measure how long each screen (Lobby, Writing, Reviewing, Scores) takes to render individually.
2. **Component-level render counts** — The `options.diffed` hook counts renders but the data isn't being collected properly.
3. **Network message frequency** — The `__perfWire` function exists but isn't being called from the transport layer.
4. **Animation audit** — The `__perfAudit` function exists but isn't being called at phase boundaries.
5. **Font loading timing** — The font tracking exists but `readyAt` is undefined.
6. **Coverage data** — `Profiler.takePreciseCoverage` is called but the results aren't being used.
7. **Phase duration tracking** — The `__perfPhase` function exists but isn't being called from the app's phase change logic.
8. **Commit tracking** — The `__perfCommit` function exists but isn't being called.

## Implementation Plan

### Phase 1: Fix Data Collection Bugs
1. Fix `perfData.timers` serialization — convert Map to array in `page.evaluate()`
2. Fix `perfData.renders` serialization — convert nested Map to object
3. Fix `perfData.live` serialization — convert Set to array
4. Fix LoAF entry property access — check actual Chrome entry structure
5. Fix CPU profile timing — ensure profile start/stop aligns with game phases
6. Fix CDP sampling — increase frequency, ensure samples are collected throughout

### Phase 2: Wire Up Instrumentation
1. Call `__perfPhase()` from `UseGameSession.ts` when phase changes
2. Call `__perfCommit()` from `HostSession` when state is broadcast
3. Call `__perfWire()` from `RelayTransport` when messages are sent/received
4. Call `__perfAudit()` at phase boundaries (in `UseGameSession.ts`)
5. Install `installPerfInstrumentation()` in `main.tsx` when `?perf` is in URL
6. Add `__perfJump()` function for jumping to specific phases

### Phase 3: Add Missing Metrics
1. Per-screen render timing using `performance.mark()`/`measure()`
2. Component-level render counts via Preact `options.diffed`
3. Network message frequency per phase
4. Animation audit at phase boundaries
5. Font loading timing
6. Coverage data collection

### Phase 4: Fix Assertions
1. Make assertions use `expect.soft()` so all failures are reported
2. Add per-phase assertions (p95, p99, dropped frames, long tasks, LoAF, busy, script, style, layout, renders, flushes)
3. Add memory and DOM growth assertions
4. Add timer leak assertions
5. Add layout shift assertions

### Phase 5: Improve Reporting
1. Print worst 5 LoAF entries per phase with invoker and source
2. Print top 20 CPU functions per phase
3. Print top 10 rendered components per phase
4. Print timer census by call site
5. Print network message frequency per type per phase
6. Print animation audit results
7. Print font loading timing
8. Save artifacts (trace, CPU profile, JSON report)

## Files to Modify
- `Tests/Browser/PerfBrowser.test.ts` — main test file
- `Source/App/PerfInstrumentation.ts` — Preact instrumentation
- `Source/App/Hooks/UseGameSession.ts` — phase change hooks
- `Source/Network/RelayTransport.ts` — wire tracking
- `Source/App/main.tsx` — install instrumentation
- `Source/Core/PerfHooks.ts` — new file for perf hooks

## Files to Create
- `Source/Core/PerfHooks.ts` — perf hook functions (`__perfPhase`, `__perfCommit`, `__perfWire`, `__perfAudit`, `__perfJump`)
- `Source/App/Hooks/UsePerfPhase.ts` — hook to call `__perfPhase` on phase change

## Notes
- The test runs at 1000x speed, so 60s writing phase = 60ms real time
- The game has 4 rounds with Fast pace
- The winning screen appears after all rounds are complete
- The skip button (aria-label="Следующая фаза") is in the debug dock
- The game uses `Date.now()` for timing, which is patched for speedup
- The game uses `setTimeout`/`setInterval` for UI ticks, which are patched for speedup
- The game uses `performance.now()` for some timing, which is NOT patched (this is intentional to keep rendering at real speed)
