const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const url = 'https://simpleandfastcrm.replit.app/email';
  const toEmail = 'adamsahime1998@gmail.com';
  const subject = 'Immediate test email';
  const body = 'This is an immediate email from Playwright.';
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const defaultProfile = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default');
  const profile1 = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Profile 1');
  const outDir = path.resolve(__dirname, '..', 'attached_assets', 'playwright');
  fs.mkdirSync(outDir, { recursive: true });

  let context;
  try {
    context = await chromium.launchPersistentContext(defaultProfile, { channel: 'chrome', headless: false });
  } catch {
    try {
      context = await chromium.launchPersistentContext(profile1, { channel: 'chrome', headless: false });
    } catch {
      const b = await chromium.launch({ channel: 'chrome', headless: false });
      context = await b.newContext();
    }
  }
  const page = context.pages()[0] || await context.newPage();
  page.on('console', m => console.log('console', m.type(), m.text()));
  page.on('pageerror', e => console.error('pageerror', e));
  page.on('requestfailed', r => console.error('requestfailed', r.url(), r.failure() && r.failure().errorText));

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="button-compose-email"]', { timeout: 20000 });
  await page.click('[data-testid="button-compose-email"]');

  // assume default provider based on logged-in account; no provider selection

  await page.fill('[data-testid="input-to-email"]', toEmail);
  await page.fill('#subject', subject);
  await page.fill('#body', body);

  await page.screenshot({ path: path.join(outDir, `compose-now-${Date.now()}.png`), fullPage: true });
  await page.click('[data-testid="button-send-email"]');
  const resp = await page.waitForResponse(
    r => r.url().includes('/api/scheduled-emails') && r.request().method() === 'POST',
    { timeout: 30000 }
  );
  const txt = await resp.text();
  fs.writeFileSync(path.join(outDir, `send-now-response-${Date.now()}.json`), JSON.stringify({ status: resp.status(), body: txt }, null, 2));

  await page.click('[data-testid="tab-sent"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, `sent-now-${Date.now()}.png`), fullPage: true });
}

run()
  .catch(() => process.exit(1))
  .finally(async () => {
    try {
      if (context) {
        const br = typeof context.browser === 'function' ? context.browser() : null;
        await context.close();
        if (br) await br.close();
      }
    } catch {}
  });
