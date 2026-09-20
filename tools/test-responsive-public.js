/* Responsive layout smoke test for the public homepage. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const frontendUrl = process.env.HARES_FRONTEND_URL || 'http://127.0.0.1:8088';
const browserPath = process.env.HARES_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const widths = (process.env.HARES_TEST_WIDTHS || '320,390,768,1024,1440').split(',').map(Number);
const locales = (process.env.HARES_TEST_LOCALES || 'ar,en').split(',');
const screenshotDir = process.env.HARES_SCREENSHOT_DIR || '';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: browserPath });
  const results = [];

  try {
    for (const locale of locales) {
      for (const width of widths) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const runtimeErrors = [];
        page.on('pageerror', (error) => runtimeErrors.push(error.message));
        await page.addInitScript((savedLocale) => {
          localStorage.clear();
          localStorage.setItem('locale', savedLocale);
        }, locale);
        await page.route('http://localhost:3001/api/**', (route) => route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], plans: [], videos: [] })
        }));
        await page.goto(`${frontendUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(500);

        const metrics = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;
          const allowed = '.nav, .plans-table-wrapper, .dashboard-preview, .hero-product, .q1lp-compare';
          const loginButton = document.querySelector('.q1lp-header #loginBtn');
          const loginRect = loginButton && loginButton.getBoundingClientRect();
          const loginStyle = loginButton && getComputedStyle(loginButton);
          let loginOpens = false;
          if (loginButton) {
            loginButton.click();
            loginOpens = Boolean(document.getElementById('loginModal')?.classList.contains('active'));
            if (typeof window.closeLoginModal === 'function') window.closeLoginModal();
          }
          const offenders = [];
          document.querySelectorAll('body *').forEach((element) => {
            const style = getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            if (element.closest(allowed)) return;
            const rect = element.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) return;
            if (rect.left < -3 || rect.right > viewportWidth + 3) {
              offenders.push({
                tag: element.tagName.toLowerCase(),
                id: element.id,
                className: String(element.className || '').slice(0, 100),
                text: String(element.textContent || '').trim().slice(0, 100),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          });
          return {
            direction: document.documentElement.dir,
            documentOverflow: document.documentElement.scrollWidth - viewportWidth,
            loginVisible: Boolean(loginButton && loginStyle.display !== 'none' && loginRect.width > 0 && loginRect.height > 0),
            loginOpens,
            loginHeight: loginRect ? Math.round(loginRect.height) : 0,
            loginMinHeight: loginStyle ? loginStyle.minHeight : '',
            header: ['.q1lp-header-inner', '.q1lp-logo', '.q1lp-actions'].map((selector) => {
              const element = document.querySelector(selector);
              const rect = element && element.getBoundingClientRect();
              return element ? { selector, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) } : null;
            }),
            offenders: offenders.slice(0, 5)
          };
        });

        if (screenshotDir) {
          fs.mkdirSync(screenshotDir, { recursive: true });
          await page.screenshot({
            path: path.join(screenshotDir, `homepage-${locale}-${width}.png`),
            fullPage: true
          });
        }
        results.push({ locale, width, runtimeErrors: runtimeErrors.slice(0, 3), ...metrics });
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) =>
    result.runtimeErrors.length ||
    result.documentOverflow > 2 ||
    result.offenders.length ||
    !result.loginVisible ||
    !result.loginOpens ||
    (result.width <= 680 && result.loginHeight < 44) ||
    result.direction !== (result.locale === 'ar' ? 'rtl' : 'ltr')
  );
  process.stdout.write(`${JSON.stringify({ cases: results.length, passed: results.length - failures.length, failed: failures.length, failures }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
