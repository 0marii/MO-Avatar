/**
 * Browser smoke test for MO Avatar.
 * Run with: node scripts/smoke-test.mjs
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function checkStaticRoutes(request) {
  const routes = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/ui.js',
    '/js/export.js',
    '/js/storage.js',
    '/js/vercel-observability.js',
    '/favicon.svg',
    '/og.svg',
    '/site.webmanifest',
    '/robots.txt',
    '/LICENSE',
    '/404.html',
  ];

  for (const route of routes) {
    const res = await request.get(`${BASE}${route}`);
    if (res.ok()) pass(`GET ${route}`, String(res.status()));
    else fail(`GET ${route}`, String(res.status()));
  }
}

async function testDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    pass('Desktop load', page.url());

    const canvas = page.locator('#avatar-canvas');
    if (await canvas.isVisible()) pass('Desktop canvas visible');
    else fail('Desktop canvas visible');

    const controlsTrigger = page.locator('#sheetTrigger');
    if (await controlsTrigger.isHidden()) pass('Desktop hides mobile Controls button');
    else fail('Desktop hides mobile Controls button');

    const controlsSheet = page.locator('#controlsSheet');
    if (await controlsSheet.evaluate((el) => el.classList.contains('sheet--open'))) {
      pass('Desktop controls panel open');
    } else {
      fail('Desktop controls panel open');
    }

    await page.fill('#mainName', 'TEST');
    await page.waitForTimeout(300);
    const nameValue = await page.inputValue('#mainName');
    if (nameValue === 'TEST') pass('Desktop name input updates');
    else fail('Desktop name input updates', nameValue);

    const pngData = await page.evaluate(() => {
      const canvas = document.getElementById('avatar-canvas');
      return canvas?.toDataURL('image/png') || '';
    });
    if (pngData.startsWith('data:image/png')) pass('Desktop canvas renders PNG');
    else fail('Desktop canvas renders PNG');

    await page.click('#downloadBtn');
    await page.waitForTimeout(500);
    const status = await page.textContent('#status');
    if (/Downloaded successfully|Exporting/i.test(status || '')) pass('Desktop download flow', status?.trim());
    else fail('Desktop download flow', status?.trim());
  } finally {
    await page.close();
  }
}

async function testMobile(browser) {
  const iPhone = devices['iPhone 13'];
  const page = await browser.newPage({
    ...iPhone,
    viewport: iPhone.viewport,
    userAgent: iPhone.userAgent,
    isMobile: true,
    hasTouch: true,
  });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    pass('Mobile load', iPhone.viewport.width + 'px wide');

    const trigger = page.locator('#sheetTrigger');
    if (await trigger.isVisible()) pass('Mobile Controls button visible');
    else fail('Mobile Controls button visible');

    await trigger.click();
    await page.waitForTimeout(400);

    const sheetOpen = await page.locator('#controlsSheet').evaluate((el) => el.classList.contains('sheet--open'));
    if (sheetOpen) pass('Mobile bottom sheet opens');
    else fail('Mobile bottom sheet opens');

    await page.fill('#mainName', 'MOB');
    await page.waitForTimeout(300);

    const pngData = await page.evaluate(() => {
      const canvas = document.getElementById('avatar-canvas');
      return canvas?.toDataURL('image/png') || '';
    });
    if (pngData.startsWith('data:image/png')) pass('Mobile canvas renders PNG');
    else fail('Mobile canvas renders PNG');

    await page.locator('#downloadBtn').click();
    await page.waitForTimeout(700);
    const status = await page.textContent('#status');
    if (/Downloaded successfully|Exporting/i.test(status || '')) pass('Mobile download flow', status?.trim());
    else fail('Mobile download flow', status?.trim());

    await page.locator('#sheetClose').click();
    await page.waitForTimeout(300);
    const sheetClosed = await page.locator('#controlsSheet').evaluate((el) => !el.classList.contains('sheet--open'));
    if (sheetClosed) pass('Mobile bottom sheet closes');
    else fail('Mobile bottom sheet closes');

    await page.locator('#zoomBtn').click();
    const zoomVisible = await page.locator('#zoomModal').evaluate((el) => !el.classList.contains('is-hidden'));
    if (zoomVisible) pass('Mobile zoom modal opens');
    else fail('Mobile zoom modal opens');
  } finally {
    await page.close();
  }
}

async function main() {
  console.log(`Testing ${BASE}\n`);

  const browser = await chromium.launch({ headless: true });
  const request = await browser.newContext().then((ctx) => ctx.request);

  try {
    await checkStaticRoutes(request);
    await testDesktop(browser);
    await testMobile(browser);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
