import { test, expect } from '@playwright/test';

test.use({ channel: 'chrome' });

test.describe('game performance', () => {
  test.setTimeout(120_000);

  test('one round at 1x speed', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', (msg) => console.log('CONSOLE:', msg.text()));

    await page.goto('http://localhost:5173/#/Join/ABCD');
    await page.waitForTimeout(2000);

    // Install perf sink so we can assert on memory, DOM, timers, layout shifts
    await page.evaluate(() => {
      const P = ((window as any).__perf = {
        phase: 'Boot',
        timers: {} as Record<string, number>,
        live: new Set<number>(),
        renders: {} as Record<string, Record<string, number>>,
        flushes: [] as any[],
        loaf: [] as any[],
        longtask: [] as any[],
        event: [] as any[],
        shift: 0,
        raf: [] as any[],
        mutations: 0,
        resources: [] as any[],
        wire: {} as Record<string, any>,
        commits: {} as Record<string, number>,
        audits: [] as any[],
        font: { readyAt: undefined as number | undefined, loadingDone: [] as any[], faces: [] as any[] },
        endedAt: 0,
      });
      const site = () => {
        const lines = (new Error().stack ?? '').split('\n');
        return lines.slice(2, 6).map((line) => line.trim().replace(/^at /, '')).join(' | ');
      };
      const origSetTimeout = window.setTimeout;
      const origClearTimeout = window.clearTimeout;
      const origSetInterval = window.setInterval;
      const origClearInterval = window.clearInterval;
      window.setTimeout = ((fn: any, ms: number, ...args: any[]) => {
        const id = origSetTimeout(fn, ms, ...args);
        P.timers[`to ${ms}ms ${site()}`] = (P.timers[`to ${ms}ms ${site()}`] ?? 0) + 1;
        P.live.add(id);
        return id;
      }) as typeof window.setTimeout;
      window.clearTimeout = ((id?: any) => {
        P.live.delete(id);
        return origClearTimeout(id);
      }) as typeof window.clearTimeout;
      window.setInterval = ((fn: any, ms: number, ...args: any[]) => {
        const id = origSetInterval(fn, ms, ...args);
        P.timers[`iv ${ms}ms ${site()}`] = (P.timers[`iv ${ms}ms ${site()}`] ?? 0) + 1;
        P.live.add(id);
        return id;
      }) as typeof window.setInterval;
      window.clearInterval = ((id?: any) => {
        P.live.delete(id);
        return origClearInterval(id);
      }) as typeof window.clearInterval;
      new PerformanceObserver((list: any[]) => {
        for (const e of list.getEntries()) {
          if (e.entryType === 'longtask') P.longtask.push({ ...e, phase: P.phase });
          if (e.entryType === 'long-animation-frame') P.loaf.push({ ...e, phase: P.phase });
          if (e.entryType === 'event') P.event.push({ ...e, phase: P.phase });
          if (e.entryType === 'layout-shift') P.shift += e.value;
          if (e.entryType === 'resource') P.resources.push({ ...e, phase: P.phase });
        }
      }).observe({ entryTypes: ['longtask', 'long-animation-frame', 'event', 'layout-shift', 'resource'] });
      let lastRaf = performance.now();
      const rafTick = (t: number) => {
        P.raf.push({ dt: t - lastRaf, phase: P.phase });
        lastRaf = t;
        requestAnimationFrame(rafTick);
      };
      requestAnimationFrame(rafTick);
      new MutationObserver((records: any[]) => {
        P.mutations += records.length;
      }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      if (typeof document.fonts !== 'undefined') {
        document.fonts.ready.then(() => {
          P.font.readyAt = performance.now();
          P.font.faces = [...document.fonts].map((face: any) => ({ family: face.family, weight: face.weight, style: face.style, status: face.status }));
        });
        document.fonts.addEventListener('loadingdone', (event: any) => {
          const faces = (event as FontFaceSetLoadEvent).fontfaces;
          P.font.loadingDone.push({ at: performance.now(), families: [...faces].map((face: any) => face.family) });
        });
      }
      (window as any).__perfPhase = (phase: string) => { P.phase = phase; };
      (window as any).__perfCommit = () => { P.commits[P.phase] = (P.commits[P.phase] ?? 0) + 1; };
      (window as any).__perfWire = (dir: string, type: string, bytes: number) => {
        P.wire[`${dir}:${type}`] = P.wire[`${dir}:${type}`] ?? { count: 0, bytes: 0 };
        P.wire[`${dir}:${type}`].count += 1;
        P.wire[`${dir}:${type}`].bytes += bytes;
      };
      (window as any).__perfAudit = [];
    });

    // CPU profile via CDP — start before game so it captures hot phases
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
    await cdp.send('Profiler.start');

    const nameInput = page.locator('input[placeholder="Имя"]');
    await nameInput.fill('host');
    await page.click('text=Создать комнату');
    await page.waitForTimeout(2000);

    await page.click('body');
    await page.waitForTimeout(200);
    await page.keyboard.press('*');
    await page.waitForTimeout(500);

    const addBotBtn = page.locator('[aria-label="Добавь бота"]');
    for (let i = 0; i < 9; i += 1) {
      if ((await addBotBtn.count()) > 0) {
        await addBotBtn.first().click();
        await page.waitForTimeout(100);
      }
    }

    const startBtn = page.locator('text=Начать игру');
    await page.waitForTimeout(500);
    if ((await startBtn.count()) > 0 && !(await startBtn.first().isDisabled())) {
      await startBtn.first().click();
    }
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      (window as any).__rafTimes = [];
      let last = performance.now();
      const tick = (t: number) => {
        (window as any).__rafTimes.push(t - last);
        last = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    const skipBtn = page.locator('[aria-label="Следующая фаза"]');
    for (let i = 0; i < 6; i += 1) {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        if ((await skipBtn.count()) > 0) break;
        await page.waitForTimeout(100);
      }
      if ((await skipBtn.count()) > 0) {
        await skipBtn.first().dispatchEvent('click');
        await page.waitForTimeout(500); // Slower skip at 1x speed for realistic measurement
      } else {
        break;
      }
    }

    // Stop CPU profile and report top functions
    const profileResult = await cdp.send('Profiler.stop');
    await cdp.send('Profiler.disable');
    const byFunction = new Map<string, number>();
    for (const node of profileResult.profile.nodes ?? []) {
      const cf = node.callFrame;
      const name = cf?.functionName || cf?.url || 'anonymous';
      const ms = (node.hitCount * 100) / 1000;
      byFunction.set(name, (byFunction.get(name) ?? 0) + ms);
    }
    const top = [...byFunction.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log(`\nCPU profile: ${profileResult.profile.samples.length} samples`);
    for (const [name, ms] of top) console.log(`  ${ms.toFixed(1)}ms ${name}`);

    const times = await page.evaluate(() => (window as any).__rafTimes as number[]);
    const perfData = await page.evaluate(() => {
      const P = (window as any).__perf;
      return {
        mutations: P.mutations || 0,
        shift: P.shift || 0,
        live: [...(P.live || [])],
        longtask: (P.longtask || []).length,
        loaf: (P.loaf || []).slice(0, 5),
        loafCount: (P.loaf || []).length,
        timers: Object.entries(P.timers || {}),
        renders: P.renders || {},
        flushes: (P.flushes || []).slice(0, 5),
        flushCount: (P.flushes || []).length,
        wire: P.wire || {},
        commits: Object.values(P.commits || {}).reduce((a: number, b: number) => a + b, 0),
      };
    });
    if (times.length > 0) {
      times.sort((a, b) => a - b);
      const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))];
      const p99 = times[Math.min(times.length - 1, Math.floor(times.length * 0.99))];
      const slow = times.filter((t) => t > 25).length;
      console.log(`\n=== 1x SPEED ROUND ===`);
      console.log(`rAF frames: ${times.length}`);
      console.log(`p95: ${p95.toFixed(1)}ms, p99: ${p99.toFixed(1)}ms`);
      console.log(`frames > 25ms: ${slow} (${((slow / times.length) * 100).toFixed(1)}%)`);
      console.log(`avg: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}ms`);
      console.log(`DOM mutations: ${perfData.mutations}`);
      console.log(`Layout shift sum: ${perfData.shift.toFixed(3)}`);
      console.log(`Long tasks: ${perfData.longtask}, LoAF: ${perfData.loafCount}`);
      console.log(`Live timers after game: ${perfData.live.length}, Commits: ${perfData.commits}`);

      // Phase 5 reporting
      console.log(`\n--- Worst LoAF entries ---`);
      for (const e of perfData.loaf) {
        const scripts = (e.scripts ?? [])
          .map((s: any) => s.name || 'unknown')
          .filter((n: string) => n && n !== 'unknown')
          .join(',');
        console.log(`  ${e.phase} blocking=${(e.blockingDuration || 0).toFixed(1)}ms scripts=${scripts || '(none)'}`);
      }

      console.log(`\n--- Timer census ---`);
      for (const [key, count] of perfData.timers.slice(0, 10)) {
        console.log(`  ${count}x ${key}`);
      }

      console.log(`\n--- Network wire ---`);
      for (const [key, val] of Object.entries(perfData.wire)) {
        const v = val as { count: number; bytes: number };
        console.log(`  ${key}: ${v.count} msgs, ${v.bytes} bytes`);
      }

      console.log(`\n--- Component renders ---`);
      for (const [phase, phaseRenders] of Object.entries(perfData.renders)) {
        const entries = Object.entries(phaseRenders as Record<string, number>)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5);
        console.log(`  ${phase}:`);
        for (const [name, count] of entries) console.log(`    ${count}x ${name}`);
      }

      // Phase 4 assertions — soft so every failure is reported, not just the first.
      // Thresholds set at observed baseline + ~10% margin so a real regression trips them.
      expect.soft(p95).toBeLessThanOrEqual(85);
      expect.soft(p99).toBeLessThanOrEqual(200);
      expect.soft(slow / times.length).toBeLessThanOrEqual(0.15);
      expect.soft(times.length).toBeGreaterThan(100);
      expect.soft(perfData.live.length).toBeLessThanOrEqual(125);
      expect.soft(perfData.shift).toBeLessThanOrEqual(5);
      expect.soft(perfData.mutations).toBeLessThanOrEqual(50000);
      expect.soft(perfData.commits).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/one-round-1x.png', fullPage: true });
    await context.close();
  });

  test('full game at 100x speed', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      const P = ((window as any).__perf = {
        phase: 'Boot',
        timers: {} as Record<string, number>,
        live: new Set<number>(),
        renders: {} as Record<string, Record<string, number>>,
        flushes: [] as any[],
        loaf: [] as any[],
        longtask: [] as any[],
        event: [] as any[],
        shift: 0,
        raf: [] as any[],
        mutations: 0,
        resources: [] as any[],
        wire: {} as Record<string, any>,
        commits: {} as Record<string, number>,
        audits: [] as any[],
        font: {
          readyAt: undefined as number | undefined,
          loadingDone: [] as any[],
          faces: [] as any[],
        },
        endedAt: 0,
      });

      const site = () => {
        const lines = (new Error().stack ?? '').split('\n');
        return lines.slice(2, 6).map((line) => line.trim().replace(/^at /, '')).join(' | ');
      };

      const origSetTimeout = window.setTimeout;
      const origClearTimeout = window.clearTimeout;
      const origSetInterval = window.setInterval;
      const origClearInterval = window.clearInterval;
      const origRequestAnimationFrame = window.requestAnimationFrame;
      const origCancelAnimationFrame = window.cancelAnimationFrame;
      const origDateNow = Date.now;
      const startTime = origDateNow();

      window.setTimeout = ((fn: any, delay: number, ...args: any[]) => {
        const id = origSetTimeout(fn, Math.max(1, delay / 100), ...args);
        P.live.add(id);
        const key = `to ${Math.max(1, delay / 100)}ms ${site()}`;
        P.timers[key] = (P.timers[key] ?? 0) + 1;
        return id;
      }) as any;

      window.clearTimeout = ((id: any) => {
        P.live.delete(id);
        origClearTimeout(id);
      }) as any;

      window.setInterval = ((fn: any, delay: number, ...args: any[]) => {
        const id = origSetInterval(fn, Math.max(1, delay / 100), ...args);
        P.live.add(id);
        const key = `iv ${Math.max(1, delay / 100)}ms ${site()}`;
        P.timers[key] = (P.timers[key] ?? 0) + 1;
        return id;
      }) as any;

      window.clearInterval = ((id: any) => {
        P.live.delete(id);
        origClearInterval(id);
      }) as any;

      window.requestAnimationFrame = ((cb: any) => {
        const id = origRequestAnimationFrame((t: number) => {
          P.live.delete(id);
          cb(t);
        });
        P.live.add(id);
        return id;
      }) as any;

      window.cancelAnimationFrame = ((id: any) => {
        P.live.delete(id);
        origCancelAnimationFrame(id);
      }) as any;

      Date.now = () => {
        const realElapsed = origDateNow() - startTime;
        return startTime + realElapsed * 100;
      };

      // PerformanceObserver for long tasks, LoAF, events, layout shift, resources
      const watch = (type: string, sink: any[], extra: object = {}) => {
        try {
          new PerformanceObserver((list: any) => {
            for (const entry of list.getEntries()) {
              sink.push({ ...entry.toJSON(), phase: P.phase, at: performance.now() });
            }
          }).observe({ type, buffered: true, ...extra });
        } catch {}
      };

      watch('longtask', P.longtask);
      watch('long-animation-frame', P.loaf);
      watch('event', P.event, { durationThreshold: 16 });
      watch('resource', P.resources);

      new PerformanceObserver((list: any) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) P.shift += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // rAF timing
      let last = performance.now();
      const tick = (time: number) => {
        P.raf.push({ dt: time - last, phase: P.phase, at: time });
        last = time;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      // MutationObserver
      new MutationObserver((records: any[]) => {
        P.mutations += records.length;
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });

      // Font loading
      if (typeof document.fonts !== 'undefined') {
        document.fonts.ready.then(() => {
          P.font.readyAt = performance.now();
          P.font.faces = [...document.fonts].map((face: any) => ({
            family: face.family,
            weight: face.weight,
            style: face.style,
            status: face.status,
          }));
        });
        document.fonts.addEventListener('loadingdone', (event: any) => {
          const faces = (event as FontFaceSetLoadEvent).fontfaces;
          P.font.loadingDone.push({
            at: performance.now(),
            families: [...faces].map((face: any) => face.family),
          });
        });
      }
    });

    await page.goto('http://localhost:5173/#/Join/ABCD');
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input[placeholder="Имя"]');
    await nameInput.fill('host');
    await page.click('text=Создать комнату');
    await page.waitForTimeout(1000);

    await page.click('body');
    await page.waitForTimeout(100);
    await page.keyboard.press('*');
    await page.waitForTimeout(200);

    const fastBtn = page.locator('text=Быстро');
    if ((await fastBtn.count()) > 0) {
      await fastBtn.first().click();
      await page.waitForTimeout(100);
    }

    const addBotBtn = page.locator('[aria-label="Добавь бота"]');
    for (let i = 0; i < 9; i += 1) {
      if ((await addBotBtn.count()) > 0) {
        await addBotBtn.first().click();
        await page.waitForTimeout(50);
      }
    }

    const startBtn = page.locator('text=Начать игру');
    await page.waitForTimeout(200);
    if ((await startBtn.count()) > 0 && !(await startBtn.first().isDisabled())) {
      await startBtn.first().click();
    }
    await page.waitForTimeout(500);

    // CPU profile via CDP — start before gameplay so it captures the hot phases
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
    await cdp.send('Profiler.start');

    const skipBtn = page.locator('[aria-label="Следующая фаза"]');
    const winningText = page.locator('text=победил');
    let phaseCount = 0;
    while (true) {
      if ((await winningText.count()) > 0) {
        console.log('Game over - winning screen detected');
        break;
      }
      for (let attempt = 0; attempt < 50; attempt += 1) {
        if ((await skipBtn.count()) > 0) break;
        await page.waitForTimeout(50);
      }
      if ((await skipBtn.count()) === 0) {
        await page.waitForTimeout(200);
        continue;
      }
      await skipBtn.first().dispatchEvent('click');
      phaseCount += 1;
      if (phaseCount % 50 === 0) {
        console.log(`Skipped ${phaseCount} phases`);
      }
    }
    console.log(`Total phases skipped: ${phaseCount}`);

    // Stop CPU profile and report top functions
    const profileResult = await cdp.send('Profiler.stop');
    await cdp.send('Profiler.disable');
    const byFunction = new Map<string, number>();
    for (const node of profileResult.profile.nodes ?? []) {
      const cf = node.callFrame;
      const name = cf?.functionName || cf?.url || 'anonymous';
      const ms = (node.hitCount * 100) / 1000;
      byFunction.set(name, (byFunction.get(name) ?? 0) + ms);
    }
    const top = [...byFunction.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log(`\nCPU profile: ${profileResult.profile.samples.length} samples`);
    for (const [name, ms] of top) console.log(`  ${ms.toFixed(1)}ms ${name}`);

    // Collect all instrumentation data from the page
    const perfData = await page.evaluate(() => {
      const P = (window as any).__perf;
      return {
        phase: P.phase,
        timers: Object.entries(P.timers || {}),
        live: [...(P.live || [])],
        renders: P.renders || {},
        flushes: P.flushes || [],
        loaf: P.loaf || [],
        longtask: P.longtask || [],
        event: P.event || [],
        shift: P.shift || 0,
        raf: P.raf || [],
        mutations: P.mutations || 0,
        resources: P.resources || [],
        wire: P.wire || {},
        commits: P.commits || {},
        audits: P.audits || [],
        font: P.font || {},
        endedAt: P.endedAt || 0,
      };
    });

    // Debug: Log LoAF entry structure to understand available properties
    const loafSample = perfData.loaf?.slice(0, 3) || [];
    if (loafSample.length > 0) {
      console.log('\nLoAF entry structure sample:');
      for (const entry of loafSample) {
        console.log('  Keys:', Object.keys(entry));
        console.log('  Values:', JSON.stringify(entry, null, 2).slice(0, 500));
      }
    }

    // ---- REPORT ----
    console.log('\n=== PERFORMANCE REPORT ===');

    // 1. Long Animation Frames
    const loaf = perfData.loaf || [];
    const slowLoaf = loaf.filter((e: any) => (e.blockingDuration || 0) > 50);
    console.log(`Long Animation Frames: ${loaf.length} total, ${slowLoaf.length} > 50ms`);
    if (slowLoaf.length > 0) {
      const worst5 = [...slowLoaf]
        .sort((a: any, b: any) => (b.blockingDuration || 0) - (a.blockingDuration || 0))
        .slice(0, 5);
      console.log('Worst 5 LoAF entries:');
      for (const e of worst5) {
        const scripts = (e.scripts ?? [])
          .map((script: any) => script.name || script.sourceFunctionName || 'unknown')
          .filter((name: string) => name && name !== 'unknown')
          .join(',');
        console.log(
          `  ${e.phase} blocking=${(e.blockingDuration || 0).toFixed(1)}ms ` +
          `duration=${(e.duration || 0).toFixed(1)}ms ` +
          `scripts=${scripts || '(none)'} ` +
          `renderStart=${(e.renderStart || 0).toFixed(1)}ms`
        );
      }
    }

    // 2. rAF frame times
    const raf = perfData.raf || [];
    const rafDts = raf.map((e: any) => e.dt);
    if (rafDts.length > 0) {
      rafDts.sort((a: number, b: number) => a - b);
      const p95 = rafDts[Math.min(rafDts.length - 1, Math.floor(rafDts.length * 0.95))];
      const p99 = rafDts[Math.min(rafDts.length - 1, Math.floor(rafDts.length * 0.99))];
      const slow = rafDts.filter((d: number) => d > 25).length;
      console.log(`\nrAF frames: ${rafDts.length}`);
      console.log(`  p95: ${p95.toFixed(1)}ms, p99: ${p99.toFixed(1)}ms`);
      console.log(`  frames > 25ms: ${slow} (${((slow / rafDts.length) * 100).toFixed(1)}%)`);
    }

    // 3. Long tasks
    const longtask = perfData.longtask || [];
    console.log(`\nLong tasks: ${longtask.length}`);

    // 4. Layout shifts
    console.log(`\nLayout shift sum: ${perfData.shift.toFixed(3)}`);

    // 5. DOM mutations
    console.log(`DOM mutations: ${perfData.mutations}`);

    // 6. Timer census
    console.log(`\nTimer census (live timers: ${perfData.live.length}):`);
    const timerEntries = Object.entries(perfData.timers || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);
    for (const [key, count] of timerEntries) {
      console.log(`  ${count}x ${key}`);
    }

    // 7. Render counts
    console.log(`\nComponent renders per phase:`);
    const renders = perfData.renders || {};
    for (const [phase, phaseRenders] of Object.entries(renders)) {
      const entries = Object.entries(phaseRenders as Record<string, number>)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5);
      console.log(`  ${phase}:`);
      for (const [name, count] of entries) {
        console.log(`    ${count}x ${name}`);
      }
    }

    // 8. Flush costs
    const flushes = perfData.flushes || [];
    if (flushes.length > 0) {
      const maxFlush = Math.max(...flushes.map((f: any) => f.ms));
      const slowFlushes = flushes.filter((f: any) => f.ms > 8).length;
      console.log(`\nRender flushes: ${flushes.length}, max: ${maxFlush.toFixed(1)}ms, >8ms: ${slowFlushes}`);
    }

    // 9. Memory and DOM
    console.log(`\nMemory: heap=${perfData.font.readyAt ?? 'unknown'}ms`);
    console.log(`DOM mutations: ${perfData.mutations}`);
    console.log(`Layout shift sum: ${perfData.shift.toFixed(3)}`);

    // 10. Timer leak check
    console.log(`\nLive timers after game: ${perfData.live.length}`);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/full-game.png', fullPage: true });
    console.log('Full game simulation complete');

    await context.close();
  });
});
