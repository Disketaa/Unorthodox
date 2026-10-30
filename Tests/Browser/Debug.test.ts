import { test } from '@playwright/test';

test.use({ channel: 'chrome' });

test.describe('debug game connection', () => {
  test('create room, add bots, start game', async ({ page }) => {
    page.on('console', (msg) => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:5173/#/Join/ABCD');
    await page.waitForTimeout(3000);

    // Fill name and create room
    const nameInput = page.locator('input[placeholder="Имя"]');
    await nameInput.fill('host');
    await page.click('text=Создать комнату');
    await page.waitForTimeout(3000);

    // Blur any focused input before pressing *
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Enable debug mode by pressing * key
    await page.keyboard.press('*');
    await page.waitForTimeout(1000);

    // Add 9 bots using aria-label selector
    const addBotBtn = page.locator('[aria-label="Добавь бота"]');
    for (let i = 0; i < 9; i += 1) {
      if ((await addBotBtn.count()) > 0) {
        await addBotBtn.first().click();
        await page.waitForTimeout(300);
      }
    }

    // Start game
    const startBtn = page.locator('text=Начать игру');
    await page.waitForTimeout(1000);
    if ((await startBtn.count()) > 0 && !(await startBtn.first().isDisabled())) {
      await startBtn.first().click();
    }
    await page.waitForTimeout(2000);

    // Play 3 rounds
    for (let round = 0; round < 3; round += 1) {
      console.log(`=== Round ${round + 1} ===`);
      await page.waitForTimeout(1000);
      await page.waitForTimeout(1000);
      const nextBtn = page.locator('text=Следующий раунд');
      if ((await nextBtn.count()) > 0) {
        await nextBtn.first().click();
      }
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'test-results/debug-game.png', fullPage: true });
    console.log('Game simulation complete');
  });
});
