const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function now() {
  return new Date().toISOString();
}

function logLine(outDir, obj) {
  const p = path.join(outDir, 'keepalive.log');
  fs.appendFileSync(p, JSON.stringify(obj) + '\n');
}

async function startOnce(outDir) {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const defaultProfile = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default');
  const profile1 = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Profile 1');
  let context;
  try {
    context = await chromium.launchPersistentContext(defaultProfile, { channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] });
  } catch {
    try {
      context = await chromium.launchPersistentContext(profile1, { channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    } catch {
      const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] });
      context = await b.newContext();
    }
  }
  const page = context.pages()[0] || await context.newPage();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(parameters);
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  const start = Date.now();
  page.on('console', m => logLine(outDir, { ts: now(), type: 'console', level: m.type(), text: m.text() }));
  page.on('pageerror', e => logLine(outDir, { ts: now(), type: 'pageerror', error: String(e) }));
  page.on('requestfailed', r => logLine(outDir, { ts: now(), type: 'requestfailed', url: r.url(), error: r.failure() && r.failure().errorText }));
  logLine(outDir, { ts: now(), type: 'start' });
  await page.goto('https://simpleandfastcrm.replit.app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  try {
    const btn = await page.locator('text=/Sign in|Log in|Login|Continue|Authorize/i').first();
    if (await btn.count()) {
      await btn.click();
    }
  } catch {}
  let alive = true;
  page.on('close', () => { alive = false; });
  while (alive) {
    const uptime = Math.round((Date.now() - start) / 1000);
    logLine(outDir, { ts: now(), type: 'heartbeat', uptime });
    try {
      await page.waitForTimeout(1000);
    } catch {
      break;
    }
    if (uptime >= 60) {
      logLine(outDir, { ts: now(), type: 'milestone', reached: '60s' });
    }
  }
  const uptime = Math.round((Date.now() - start) / 1000);
  logLine(outDir, { ts: now(), type: 'end', uptime });
  try {
    await context.close();
  } catch {}
}

async function run() {
  const outDir = path.resolve(__dirname, '..', 'attached_assets', 'playwright');
  fs.mkdirSync(outDir, { recursive: true });
  while (true) {
    try {
      await startOnce(outDir);
    } catch (e) {
      logLine(outDir, { ts: now(), type: 'crash', error: String(e) });
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

run().catch(() => process.exit(1));
