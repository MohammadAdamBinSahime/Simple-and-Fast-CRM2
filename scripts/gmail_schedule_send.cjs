const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function fmtAmPm(date) {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

async function run() {
  const toEmail = 'adamsahime1998@gmail.com';
  const subject = 'Gmail scheduled test';
  const body = 'Scheduled via Gmail UI automation.';
  const sendInMs = 3 * 60 * 1000;
  const at = new Date(Date.now() + sendInMs);
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
      const b = await chromium.launch({ channel: 'chrome', headless: false });
      context = await b.newContext();
    }
  }
  const page = context.pages()[0] || await context.newPage();
  page.on('console', m => console.log('console', m.type(), m.text()));
  page.on('pageerror', e => console.error('pageerror', e));
  page.on('requestfailed', r => console.error('requestfailed', r.url(), r.failure() && r.failure().errorText));

  await page.goto('https://mail.google.com/mail/u/0/#inbox?compose=new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  try {
    await page.fill('textarea[name="to"]', toEmail);
  } catch {
    await page.fill('input[aria-label="To"]', toEmail).catch(() => {});
  }
  await page.fill('input[name="subjectbox"]', subject);
  await page.click('div[aria-label="Message Body"]').catch(() => {});
  await page.keyboard.type(body);
  await page.screenshot({ path: path.join(outDir, `gmail-compose-${Date.now()}.png`), fullPage: true });

  let scheduledOk = false;
  try {
    await page.click('div[aria-label="More send options"]');
    await page.click('text=Schedule send');
    await page.click('text=Pick date & time');
    await page.fill('input[aria-label="Date"]', `${at.getMonth()+1}/${at.getDate()}/${at.getFullYear()}`);
    await page.fill('input[aria-label="Time"]', fmtAmPm(at));
    await page.click('text=Schedule send');
    scheduledOk = true;
  } catch (e) {
    console.error('schedule_ui_error', e);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, `gmail-scheduled-${Date.now()}.png`), fullPage: true });
  fs.writeFileSync(path.join(outDir, `gmail-schedule-status-${Date.now()}.json`), JSON.stringify({ ok: scheduledOk, scheduledFor: at.toISOString() }, null, 2));
}

run().catch(() => process.exit(1));
