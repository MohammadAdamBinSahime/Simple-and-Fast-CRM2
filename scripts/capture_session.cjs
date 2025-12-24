const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const url = 'https://simpleandfastcrm.replit.app/';
  const outDir = path.resolve(__dirname, '..', 'attached_assets', 'playwright');
  fs.mkdirSync(outDir, { recursive: true });
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const defaultProfile = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default');
  const profile1 = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Profile 1');
  let context;
  try {
    context = await chromium.launchPersistentContext(defaultProfile, { channel: 'chrome', headless: false });
  } catch {
    try {
      context = await chromium.launchPersistentContext(profile1, { channel: 'chrome', headless: false });
    } catch {
      context = await chromium.launch({ channel: 'chrome', headless: false }).then(b => b.newContext());
    }
  }
  const page = context.pages()[0] || await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true });
  page.on('console', m => console.log('console', m.type(), m.text()));
  page.on('pageerror', e => console.error('pageerror', e));
  page.on('requestfailed', r => console.error('requestfailed', r.url(), r.failure() && r.failure().errorText));
  let captured = false;
  const statePath = path.join(outDir, 'storage-state.json');
  page.on('response', async r => {
    try {
      if (!captured && r.url().includes('/api/me') && r.status() === 200) {
        captured = true;
        await context.storageState({ path: statePath });
        await page.screenshot({ path: path.join(outDir, `logged-in-${Date.now()}.png`), fullPage: true });
      }
    } catch {}
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  try {
    const loginBtn = await page.locator('text=/Sign in|Log in|Login|Continue|Authorize/i').first();
    if (await loginBtn.count()) {
      await loginBtn.click();
    }
  } catch {}

  let keepAlive = true;
  do {
    try {
      const x = 50 + Math.floor(Math.random() * 900);
      const y = 50 + Math.floor(Math.random() * 700);
      await page.mouse.move(x, y, { steps: 5 });
      await page.mouse.wheel(0, Math.floor(Math.random() * 1400) - 700);
      const keys = ['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'Escape'];
      await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
      await page.focus('body').catch(() => {});
      await page.keyboard.type(Math.random().toString(36).slice(2, 8)).catch(() => {});
      const els = await page.$$('button, [role="button"], a, input, textarea, select');
      if (els.length) {
        const el = els[Math.floor(Math.random() * els.length)];
        await el.hover().catch(() => {});
        const box = await el.boundingBox();
        if (box) {
          await page.mouse.click(box.x + Math.min(10, box.width / 2), box.y + Math.min(10, box.height / 2)).catch(() => {});
        } else {
          await el.click({ trial: true }).catch(() => {});
        }
      }
      await page.evaluate(() => window.scrollBy(0, Math.floor(Math.random() * 1000) - 500)).catch(() => {});
    } catch {}
    await page.waitForTimeout(3000);
  } while (keepAlive);

  await context.tracing.stop({ path: path.join(outDir, 'trace-login.zip') });
}

run().catch(() => process.exit(1));
