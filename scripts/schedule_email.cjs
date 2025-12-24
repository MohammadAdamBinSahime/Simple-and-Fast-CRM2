const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const url = 'https://simpleandfastcrm.replit.app/email';
  const toEmail = 'adamsahime1998@gmail.com';
  const subject = 'Scheduled test email';
  const body = 'This is a scheduled email from Playwright.';
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

  await page.fill('[data-testid="input-to-email"]', toEmail);
  await page.fill('#subject', subject);
  await page.fill('#body', body);

  const sendInMs = 3 * 60 * 1000;
  const at = new Date(Date.now() + sendInMs);
  const hh = String(at.getHours()).padStart(2, '0');
  const mm = String(at.getMinutes()).padStart(2, '0');
  const timeVal = `${hh}:${mm}`;

  await page.click('[data-testid="button-select-date"]');
  try {
    const todayButton = page.locator('.rdp-day_today').first();
    if (await todayButton.count()) {
      await todayButton.click();
    } else {
      await page.keyboard.press('Enter');
    }
  } catch {}

  await page.fill('[data-testid="input-time"]', timeVal);
  await page.screenshot({ path: path.join(outDir, `compose-${Date.now()}.png`), fullPage: true });
  try {
    await page.click('[data-testid="button-send-email"]');
  } catch {}

  try {
    const resp = await page.waitForResponse(
      r => r.url().includes('/api/scheduled-emails') && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    const txt = await resp.text();
    fs.writeFileSync(path.join(outDir, `schedule-ui-response-${Date.now()}.json`), JSON.stringify({ status: resp.status(), body: txt }, null, 2));
  } catch (e) {
    console.error('wait_post_error', e);
  }
  await page.waitForTimeout(2000);
  await page.click('[data-testid="tab-scheduled"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, `scheduled-${Date.now()}.png`), fullPage: true });

  try {
    const scheduledCard = await page.locator(`text=${subject}`).first();
    if (await scheduledCard.count()) {
      await scheduledCard.scrollIntoViewIfNeeded();
    }
  } catch {}

  try {
    const resp = await page.evaluate(async (payload) => {
      const r = await fetch('/api/scheduled-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const t = await r.text();
      return { status: r.status, body: t };
    }, {
      toEmail: toEmail,
      ccEmail: null,
      subject,
      body,
      provider: 'resend',
      status: 'scheduled',
      scheduledAt: at.toISOString(),
    });
    fs.writeFileSync(path.join(outDir, `schedule-response-${Date.now()}.json`), JSON.stringify(resp, null, 2));
  } catch (e) {
    console.error('direct_post_error', e);
  }
}

run().catch(() => process.exit(1));
