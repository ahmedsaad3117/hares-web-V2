/*
 * Responsive Loans smoke test.
 *
 * Run the frontend on http://127.0.0.1:8088, then execute this file with a
 * Node runtime that has Playwright available. The API is mocked in-browser so
 * the test is deterministic and does not modify development data.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const frontendUrl = process.env.HARES_FRONTEND_URL || 'http://127.0.0.1:8088';
const outputDir = process.env.HARES_SCREENSHOT_DIR || path.join(os.tmpdir(), 'hares-responsive-loans');
const browserPath = process.env.HARES_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const user = {
  userId: 7,
  name: 'Responsive QA',
  email: 'responsive@example.test',
  roleName: 'Super Admin',
  expirationDate: '2099-12-31'
};

const loans = [
  {
    loanId: 49,
    status: 'Paid',
    paymentPlanMonths: 1,
    paidAmount: 1000,
    principalAmount: 1000,
    dueDate: '2026-09-30',
    createdBy: 7,
    customer: {
      customerId: 80,
      name: 'أبو ضياء صاحب الاسم الطويل للاختبار',
      phoneNumber: '+201001234567'
    },
    branch: {
      name: 'مهله راكان - فرع طويل',
      institution: { name: 'مؤسسة مهله راكان للخدمات المالية' }
    },
    institution: { name: 'مؤسسة مهله راكان للخدمات المالية' },
    product: { name: 'بطاقات شحن سوا بباقة طويلة' }
  },
  {
    loanId: 1052,
    status: 'Active',
    paymentPlanMonths: 12,
    paidAmount: 3250,
    principalAmount: 12000,
    dueDate: '2027-08-15',
    createdBy: 7,
    customer: {
      customerId: 4102,
      name: 'A very long English customer name for responsive verification',
      phoneNumber: '+966501234567'
    },
    branch: {
      name: 'Central Operations Branch',
      institution: { name: 'International Finance Institution' }
    },
    institution: { name: 'International Finance Institution' },
    product: { name: 'Extended consumer finance product name' }
  }
];

function mockedResponse(url) {
  if (url.includes('/users/me')) return user;
  if (url.includes('/loans/search')) return loans;
  if (/\/loans(?:\?|$)/.test(url)) {
    return { data: loans, meta: { page: 1, totalPages: 8, total: 80, limit: 10 } };
  }
  if (url.includes('/quick-links')) return [];
  if (url.includes('/announcements')) return null;
  if (url.includes('/settings')) return {};
  return [];
}

async function run() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserPath
  });
  const results = [];

  try {
    for (const locale of ['ar', 'en']) {
      for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: width < 768 ? 900 : 960 },
          deviceScaleFactor: 1
        });
        const page = await context.newPage();
        const consoleErrors = [];

        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await page.addInitScript(({ savedUser, savedLocale }) => {
          localStorage.setItem('token', 'responsive-test-token');
          localStorage.setItem('user', JSON.stringify(savedUser));
          localStorage.setItem('locale', savedLocale);
        }, { savedUser: user, savedLocale: locale });

        await page.route('http://localhost:3001/api/**', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockedResponse(route.request().url()))
          });
        });

        await page.goto(`${frontendUrl}/pages/loans.html`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.loan-cell-id');
        await page.evaluate(() => window.enhanceResponsiveTables(document));

        const measurements = await page.evaluate(() => {
          const root = document.documentElement;
          const filter = document.querySelector('.loans-filter');
          const firstCard = document.querySelector('#loansTableBody tr');
          const whatsapp = document.querySelector('.loan-whatsapp-inline');
          return {
            documentOverflow: root.scrollWidth - root.clientWidth,
            filterScrollable: filter.scrollWidth > filter.clientWidth,
            cardWidth: Math.round(firstCard.getBoundingClientRect().width),
            viewportWidth: root.clientWidth,
            whatsappWidth: Math.round(whatsapp.getBoundingClientRect().width),
            direction: root.dir
          };
        });

        const screenshot = path.join(outputDir, `loans-${locale}-${width}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });

        const passed = measurements.documentOverflow <= 1 &&
          measurements.whatsappWidth >= (width <= 768 ? 44 : 36) &&
          measurements.direction === (locale === 'ar' ? 'rtl' : 'ltr');

        results.push({ locale, width, passed, consoleErrors, screenshot, ...measurements });
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  if (results.some((result) => !result.passed || result.consoleErrors.length)) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
