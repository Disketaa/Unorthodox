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
        await page.waitForTimeout(200);
      } else {
        break;
      }
    }

    const times = await page.evaluate(() => (window as any).__rafTimes as number[]);
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
    }

    await context.close();
  });

  test('full game at 100x speed', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.addInitScript(() => {
      const origSetTimeout = window.setTimeout;
      const origSetInterval = window.setInterval;
      const origDateNow = Date.now;
      const startTime = origDateNow();

      window.setTimeout = ((fn: any, delay: number, ...args: any[]) => {
        return origSetTimeout(fn, Math.max(1, delay / 100), ...args);
      }) as any;

      window.setInterval = ((fn: any, delay: number, ...args: any[]) => {
        return origSetInterval(fn, Math.max(1, delay / 100), ...args);
      }) as any;

      Date.now = () => {
        const realElapsed = origDateNow() - startTime;
        return startTime + realElapsed * 100;
      };
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

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/full-game.png', fullPage: true });
    console.log('Full game simulation complete');

    await context.close();
  });
});
