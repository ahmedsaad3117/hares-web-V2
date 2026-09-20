/* Responsive layout smoke test for every authenticated HTML page. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const projectRoot = path.resolve(__dirname, '..');
const frontendUrl = process.env.HARES_FRONTEND_URL || 'http://127.0.0.1:8088';
const browserPath = process.env.HARES_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const testWidths = (process.env.HARES_TEST_WIDTHS || '320,390,768,1024,1440')
  .split(',').map(Number).filter(Boolean);
const testLocales = (process.env.HARES_TEST_LOCALES || 'ar,en').split(',').filter(Boolean);
const screenshotDir = process.env.HARES_SCREENSHOT_DIR || '';
const testConcurrency = Number(process.env.HARES_TEST_CONCURRENCY || 4);
const requestedPages = (process.env.HARES_TEST_PAGES || '').split(',').filter(Boolean);
const pages = fs.readdirSync(path.join(projectRoot, 'pages'))
  .filter((file) => file.endsWith('.html'))
  .filter((file) => !requestedPages.length || requestedPages.includes(file))
  .sort();

const user = {
  userId: 1,
  name: 'Responsive QA',
  email: 'qa@example.test',
  roleName: 'Super Admin',
  expirationDate: '2099-12-31'
};

const entity = {
  id: 1,
  userId: 1,
  customerId: 1,
  loanId: 1,
  branchId: 1,
  institutionId: 1,
  productId: 1,
  installmentId: 1,
  name: 'Responsive verification record',
  fullName: 'Responsive verification record',
  email: 'qa@example.test',
  phoneNumber: '+201001234567',
  nationalId: '12345678901234',
  roleName: 'Super Admin',
  institutionName: 'Responsive Institution With A Long Name',
  branchName: 'Responsive Branch With A Long Name',
  status: 'Active',
  isActive: true,
  isVisibleToBranches: true,
  description: 'A deliberately long description used for responsive layout verification.',
  searchLogId: 1,
  customerName: 'Responsive Customer With A Long Name',
  userName: 'Responsive User With A Long Name',
  userEmail: 'responsive.user.with.a.long.address@example.test',
  searchQuery: 'A deliberately long search phrase for mobile layout verification',
  searchType: 'customer',
  ipAddress: '2001:db8:85a3::8a2e:370:7334',
  expirationDate: '2099-12-31',
  type: 'institution',
  parentName: 'Responsive Parent Institution',
  principalAmount: 1000,
  paidAmount: 250,
  amount: 1000,
  balance: 750,
  paymentPlanMonths: 4,
  dueDate: '2026-12-31',
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
  institution: { institutionId: 1, name: 'Responsive Institution' },
  branch: { branchId: 1, name: 'Responsive Branch', institution: { name: 'Responsive Institution' } },
  customer: { customerId: 1, name: 'Responsive Customer', phoneNumber: '+201001234567' },
  product: { productId: 1, name: 'Responsive Product' },
  installments: []
};

function responseFor(url) {
  if (url.includes('/users/me')) return user;
  if (url.includes('/announcements/active')) return null;
  if (url.includes('/quick-links')) return [];
  const pathname = new URL(url).pathname;
  if (/\/api\/(?:products|users|search-logs)$/.test(pathname)) {
    return { data: [entity], meta: { page: 1, totalPages: 1, total: 1, limit: 10 } };
  }
  if (pathname.endsWith('/api/subscriptions/unified-subscriptions')) {
    return {
      stats: { totalInstitutions: 1, activeSubscriptions: 1, expiringSoon: 0, expired: 0 },
      subscriptions: { data: [entity], meta: { page: 1, totalPages: 1, total: 1, limit: 10 } }
    };
  }
  if (url.includes('/statistics') || url.includes('/dashboard')) {
    return {
      total: 0,
      count: 0,
      totalCustomers: 0,
      totalLoans: 0,
      totalBranches: 0,
      totalInstitutions: 0,
      activeLoans: 0,
      overdueLoans: 0,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      data: []
    };
  }
  if (/\/(?:users|customers|loans|branches|institutions|products|installments)\/\d+(?:\?|$)/.test(url)) {
    return entity;
  }
  if (url.includes('/settings')) return {};
  return { data: [], items: [], results: [], meta: { page: 1, totalPages: 1, total: 0, limit: 10 } };
}

async function inspectCase(browser, file, locale, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const runtimeErrors = [];

  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  const caseUser = file === 'my-subscription.html'
    ? { ...user, roleName: 'Institution', institutionId: 1 }
    : user;
  await page.addInitScript(({ savedUser, savedLocale }) => {
    localStorage.setItem('token', 'responsive-test-token');
    localStorage.setItem('user', JSON.stringify(savedUser));
    localStorage.setItem('locale', savedLocale);
  }, { savedUser: caseUser, savedLocale: locale });

  await page.route('http://localhost:3001/api/**', async (route) => {
    const requestUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(requestUrl.includes('/users/me') ? caseUser : responseFor(requestUrl))
    });
  });

  const url = `${frontendUrl}/pages/${file}?id=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(700);

  const measure = () => page.evaluate(() => {
    if (window.enhanceResponsiveLayout) window.enhanceResponsiveLayout(document);
    const viewportWidth = document.documentElement.clientWidth;
    const allowedScrollSelector = [
      '.sidebar', '.table-container', '.responsive-filter-rail', '.responsive-scroll-table',
      '.report-tabs', '.record-tabs-container', '.rank-tabs', '.tabs-container',
      '.filter-buttons', '.filter-tabs',
      '[style*="overflow-x: auto"]'
    ].join(',');

    const offenders = [];
    document.querySelectorAll('body *').forEach((element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;
      if (element.closest(allowedScrollSelector)) return;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      if (rect.left < -3 || rect.right > viewportWidth + 3) {
        offenders.push({
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: String(element.className || '').slice(0, 100),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        });
      }
    });

    return {
      pageName: document.body && document.body.dataset.page,
      direction: document.documentElement.dir,
      documentOverflow: document.documentElement.scrollWidth - viewportWidth,
      offenders: offenders.slice(0, 5)
    };
  });

  let metrics;
  try {
    metrics = await measure();
  } catch (error) {
    if (!/Execution context was destroyed/i.test(error.message)) throw error;
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(300);
    metrics = await measure();
  }

  if (!metrics.pageName || !metrics.direction || metrics.documentOverflow > 2 || metrics.offenders.length) {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(700);
    metrics = await measure();
  }

  const result = {
    file,
    locale,
    width,
    finalPath: new URL(page.url()).pathname,
    runtimeErrors: runtimeErrors.slice(0, 3),
    ...metrics
  };
  if (screenshotDir) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, `${file.replace('.html', '')}-${locale}-${width}.png`),
      fullPage: true
    });
  }
  await context.close();
  return result;
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: limit }, next));
  return results;
}

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: browserPath });
  const cases = [];
  for (const file of pages) {
    for (const locale of testLocales) {
      for (const width of testWidths) cases.push({ file, locale, width });
    }
  }

  let results;
  try {
    results = await runPool(cases, testConcurrency, async (item) => {
      try {
        return await inspectCase(browser, item.file, item.locale, item.width);
      } catch (error) {
        return { ...item, error: error.message, documentOverflow: 0, offenders: [], finalPath: '', pageName: '' };
      }
    });
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) =>
    result.error ||
    result.documentOverflow > 2 ||
    result.offenders.length > 0 ||
    result.direction !== (result.locale === 'ar' ? 'rtl' : 'ltr') ||
    !result.pageName ||
    !result.finalPath.endsWith(`/${result.file}`)
  );

  const summary = {
    pages: pages.length,
    cases: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    failures
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
