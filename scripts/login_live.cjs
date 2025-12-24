const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const url = 'https://simpleandfastcrm.replit.app/';
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const profileDir = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default');
  const outDir = path.resolve(__dirname, '..', 'attached_assets', 'playwright');
  fs.mkdirSync(outDir, { recursive: true });

  let context;
  try {
    context = await chromium.launchPersistentContext(profileDir, { channel: 'chrome', headless: false });
  } catch {
    const fallbackProfile = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Profile 1');
    try {
      context = await chromium.launchPersistentContext(fallbackProfile, { channel: 'chrome', headless: false });
    } catch {
      context = await chromium.launch({ channel: 'chrome', headless: false }).then(b => b.newContext());
    }
  }

  const page = context.pages()[0] || await context.newPage();
  page.on('console', m => console.log('console', m.type(), m.text()));
  page.on('pageerror', e => console.error('pageerror', e));
  page.on('requestfailed', r => console.error('requestfailed', r.url(), r.failure() && r.failure().errorText));

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  try {
    const loginButton = await page.locator('text=/Sign in|Log in|Login|Continue/i').first();
    if (await loginButton.count()) {
      await loginButton.click();
    }
  } catch {}

  await page.waitForTimeout(4000);
  try {
    await page.screenshot({ path: path.join(outDir, `login-${Date.now()}.png`), fullPage: true });
  } catch {}

  await page.waitForTimeout(1000);
  const title = await page.title();
  console.log('title', title);

  let i = 0;
  while (i < 3600) {
    try {
      const x = 50 + Math.floor(Math.random() * 900);
      const y = 50 + Math.floor(Math.random() * 700);
      await page.mouse.move(x, y, { steps: 5 });
      await page.mouse.wheel(0, Math.floor(Math.random() * 1400) - 700);
      const keys = ['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'Escape'];
      await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
    } catch {}
    await page.waitForTimeout(1000);
    i++;
  }
}

run().catch(() => process.exit(1));
