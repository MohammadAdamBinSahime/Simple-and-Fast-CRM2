const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const outDir = path.resolve(__dirname, '..', 'attached_assets', 'playwright');
  fs.mkdirSync(outDir, { recursive: true });
  await context.tracing.start({ screenshots: true, snapshots: true });
  page.on('console', m => console.log('console', m.type(), m.text()));
  page.on('pageerror', e => console.error('pageerror', e));
  page.on('requestfailed', r => console.error('requestfailed', r.url(), r.failure() && r.failure().errorText));

  await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  try {
    await page.fill('input#search', 'lofi hip hop');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 250);
    await page.mouse.move(600, 300);
    await page.mouse.wheel(0, 800);
  } catch (e) {
    console.error('error_youtube', e);
    try { await page.screenshot({ path: path.join(outDir, `error-youtube-${Date.now()}.png`), fullPage: true }); } catch {}
  }

  await page.goto('https://en.wikipedia.org/wiki/Special:Random', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  try {
    const links = await page.$$('a');
    if (links.length) {
      await links[Math.floor(Math.random() * links.length)].click();
    }
    await page.waitForTimeout(1000);
    const search = await page.$('input[name=\"search\"], input#searchInput');
    if (search) {
      await search.click();
      await page.keyboard.type('playwright automation');
      await page.keyboard.press('Enter');
    }
    await page.mouse.move(100, 100);
    await page.mouse.move(300, 400);
    await page.mouse.wheel(0, 1200);
  } catch (e) {
    console.error('error_wikipedia', e);
    try { await page.screenshot({ path: path.join(outDir, `error-wikipedia-${Date.now()}.png`), fullPage: true }); } catch {}
  }
  await page.waitForTimeout(3000);

  await page.goto('https://news.ycombinator.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  try {
    const first = await page.$('a.storylink, .titleline a');
    if (first) {
      await first.click();
      await page.waitForTimeout(4000);
    }
    await page.mouse.move(150, 150);
    await page.mouse.move(500, 500);
    await page.mouse.wheel(0, 800);
    const anchors = await page.$$('a');
    if (anchors.length) {
      await anchors[Math.floor(Math.random() * anchors.length)].click();
    }
  } catch (e) {
    console.error('error_hackernews', e);
    try { await page.screenshot({ path: path.join(outDir, `error-hn-${Date.now()}.png`), fullPage: true }); } catch {}
  }

  await context.tracing.stop({ path: path.join(outDir, 'trace.zip') });
  await browser.close();
}

run().catch(async () => {
  process.exit(1);
});
