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
- [ ] Timer census shows 0 entries — `perfData.timers` is an object but `Object.entries()` returns empty
- [ ] Render counts show 0 entries — `perfData.renders` is `Record<string, Record<string, number>>` but shows empty
- [ ] Live timers show "unknown" — `perfData.live` is a `Set<number>` which doesn't serialize to an array via `page.evaluate()`
- [ ] LoAF entries show `invoker=undefined` and `source=undefined` — Chrome entry structure may differ
- [ ] CPU profile shows 0.0ms for all functions — profile sampling interval may be too coarse
- [ ] Layout shift sum is 4.522 — high, need to investigate which elements are shifting
- [ ] DOM mutations: 42999 — very high, likely from animated elements
- [ ] Frame samples: 1 — only 1 CDP frame sample collected

### What's Missing
- [ ] Per-screen render timing — need to measure how long each screen takes to render individually
- [ ] Component-level render counts — `options.diffed` hook counts renders but data isn't collected properly
- [ ] Network message frequency — `__perfWire` function exists but isn't called from transport layer
- [ ] Animation audit — `__perfAudit` function exists but isn't called at phase boundaries
- [ ] Font loading timing — font tracking exists but `readyAt` is undefined
- [ ] Coverage data — `Profiler.takePreciseCoverage` is called but results aren't being used
- [ ] Phase duration tracking — `__perfPhase` function exists but isn't called from app's phase change logic
- [ ] Commit tracking — `__perfCommit` function exists but isn't being called

## Implementation Plan

### Phase 1: Fix Data Collection Bugs
- [ ] Fix `perfData.timers` serialization — convert Map to array in `page.evaluate()`
- [ ] Fix `perfData.renders` serialization — convert nested Map to object
- [ ] Fix `perfData.live` serialization — convert Set to array
- [ ] Fix LoAF entry property access — check actual Chrome entry structure
- [ ] Fix CPU profile timing — ensure profile start/stop aligns with game phases
- [ ] Fix CDP sampling — increase frequency, ensure samples are collected throughout

### Phase 2: Wire Up Instrumentation
- [ ] Call `__perfPhase()` from `UseGameSession.ts` when phase changes
- [ ] Call `__perfCommit()` from `HostSession` when state is broadcast
- [ ] Call `__perfWire()` from `RelayTransport` when messages are sent/received
- [ ] Call `__perfAudit()` at phase boundaries (in `UseGameSession.ts`)
- [ ] Install `installPerfInstrumentation()` in `main.tsx` when `?perf` is in URL
- [ ] Add `__perfJump()` function for jumping to specific phases

### Phase 3: Add Missing Metrics
- [ ] Per-screen render timing using `performance.mark()`/`measure()`
- [ ] Component-level render counts via Preact `options.diffed`
- [ ] Network message frequency per phase
- [ ] Animation audit at phase boundaries
- [ ] Font loading timing
- [ ] Coverage data collection

### Phase 4: Fix Assertions
- [ ] Make assertions use `expect.soft()` so all failures are reported
- [ ] Add per-phase assertions (p95, p99, dropped frames, long tasks, LoAF, busy, script, style, layout, renders, flushes)
- [ ] Add memory and DOM growth assertions
- [ ] Add timer leak assertions
- [ ] Add layout shift assertions

### Phase 5: Improve Reporting
- [ ] Print worst 5 LoAF entries per phase with invoker and source
- [ ] Print top 20 CPU functions per phase
- [ ] Print top 10 rendered components per phase
- [ ] Print timer census by call site
- [ ] Print network message frequency per type per phase
- [ ] Print animation audit results
- [ ] Print font loading timing
- [ ] Save artifacts (trace, CPU profile, JSON report)

## Files to Modify
- [x] `Tests/Browser/PerfBrowser.test.ts` — main test file
- [x] `Source/App/PerfInstrumentation.ts` — Preact instrumentation
- [x] `Source/App/Hooks/UseGameSession.ts` — phase change hooks
- [x] `Source/Network/RelayTransport.ts` — wire tracking
- [x] `Source/App/main.tsx` — install instrumentation
- [x] `Source/Core/PerfHooks.ts` — new file for perf hooks

## Files to Create
- [x] `Source/Core/PerfHooks.ts` — perf hook functions (`__perfPhase`, `__perfCommit`, `__perfWire`, `__perfAudit`, `__perfJump`)
- [x] `Source/App/Hooks/UsePerfPhase.ts` — hook to call `__perfPhase` on phase change

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
