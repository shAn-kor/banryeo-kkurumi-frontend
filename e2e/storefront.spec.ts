import { expect, test, type Page, type Request, type TestInfo } from '@playwright/test';

const MOBILE_MEMBER = {
  loginId: 'e2emobile1',
  password: 'E2e!Pass1',
  name: '모바일',
  birthDate: '19900101',
  email: 'e2e.mobile@example.test',
  phone: '010-1000-0001',
};

const DESKTOP_MEMBER = {
  loginId: 'e2edesktop1',
  password: 'E2e!Pass1',
  name: '데스크탑',
  birthDate: '19900101',
  email: 'e2e.desktop@example.test',
  phone: '010-1000-0002',
};

// `src/app/main.tsx` wraps the dev-server entry in StrictMode, so React runs
// the initial SessionProvider effect twice. A third probe is always a defect.
const EXPECTED_INITIAL_SESSION_PROBES = 2;

async function registerAndLogin(page: Page, member: typeof MOBILE_MEMBER, startsOnSignup = false): Promise<void> {
  if (!startsOnSignup) await page.goto('/signup');
  await page.getByLabel('아이디').fill(member.loginId);
  await page.getByLabel('비밀번호').fill(member.password);
  await page.getByLabel('이름').fill(member.name);
  await page.getByLabel('생년월일').fill(member.birthDate);
  await page.getByLabel('이메일').fill(member.email);
  await page.getByLabel('휴대폰 번호').fill(member.phone);
  await page.getByRole('button', { name: '회원가입', exact: true }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);
  await page.getByLabel('아이디').fill(member.loginId);
  await page.getByLabel('비밀번호').fill(member.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible();
}

async function addProductToDraft(page: Page, productName: string, quantity: string): Promise<void> {
  await page.goto('/products');
  await page.getByRole('link', { name: productName, exact: true }).click();
  await expect(page.getByRole('heading', { name: productName, exact: true })).toBeVisible();
  await page.getByLabel('주문 수량').fill(quantity);
  await page.getByRole('button', { name: '주문서에 담기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('임시 주문서에 담았습니다.');
}

async function paymentStatus(page: Page): Promise<string> {
  return (await page.getByRole('heading', { name: /결제 상태:/ }).textContent()) ?? '';
}

type BrowserDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  expectedAnonymousSessionProbes: string[];
  anonymousSessionProbeConsoleMessages: string[];
  expectedPostResponseNavigationFailures: string[];
  unexpectedUnauthorizedResponses: string[];
};

function observeBrowser(page: Page): BrowserDiagnostics {
  const diagnostics: BrowserDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    expectedAnonymousSessionProbes: [],
    anonymousSessionProbeConsoleMessages: [],
    expectedPostResponseNavigationFailures: [],
    unexpectedUnauthorizedResponses: [],
  };
  const completedLogoutRequests = new Set<Request>();
  page.on('response', (response) => {
    const request = response.request();
    const path = new URL(response.url()).pathname;
    if (response.status() === 204 && request.method() === 'POST' && path === '/api/v1/auth/logout') {
      completedLogoutRequests.add(request);
    }
    if (response.status() !== 401) return;
    if (request.method() === 'GET' && path === '/api/v1/members/me'
      && diagnostics.expectedAnonymousSessionProbes.length < EXPECTED_INITIAL_SESSION_PROBES) {
      diagnostics.expectedAnonymousSessionProbes.push(`${request.method()} ${path}`);
      return;
    }
    diagnostics.unexpectedUnauthorizedResponses.push(`${request.method()} ${path}`);
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    // Chromium can report this console message before its matching response
    // event. Pair it with the sole allowed anonymous session response below.
    if (message.text() === 'Failed to load resource: the server responded with a status of 401 ()') {
      diagnostics.anonymousSessionProbeConsoleMessages.push(message.text());
      return;
    }
    diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? 'unknown request failure';
    if (completedLogoutRequests.has(request) && errorText === 'net::ERR_ABORTED') {
      diagnostics.expectedPostResponseNavigationFailures.push(`${request.method()} ${new URL(request.url()).pathname} :: ${errorText}`);
      return;
    }
    diagnostics.requestFailures.push(`${request.method()} ${request.url()} :: ${errorText}`);
  });
  return diagnostics;
}

function expectNoBrowserErrors(diagnostics: BrowserDiagnostics): void {
  expect(diagnostics.consoleErrors, 'browser console errors').toEqual([]);
  expect(diagnostics.pageErrors, 'browser page errors').toEqual([]);
  expect(diagnostics.requestFailures, 'unexpected browser request failures').toEqual([]);
  expect(diagnostics.unexpectedUnauthorizedResponses, 'unexpected unauthorized API responses').toEqual([]);
  expect(diagnostics.expectedAnonymousSessionProbes, 'StrictMode initial anonymous session probes').toHaveLength(EXPECTED_INITIAL_SESSION_PROBES);
  expect(diagnostics.anonymousSessionProbeConsoleMessages, 'StrictMode initial anonymous session probe console messages').toHaveLength(EXPECTED_INITIAL_SESSION_PROBES);
  expect(diagnostics.expectedPostResponseNavigationFailures.length, 'at most one completed logout navigation abort').toBeLessThanOrEqual(1);
}

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth, `${label}: document overflow`).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function expectWithinViewport(page: Page, selector: string, label: string): Promise<void> {
  const bounds = await page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewportWidth: window.innerWidth };
  });
  expect(bounds.left, `${label}: left edge`).toBeGreaterThanOrEqual(-1);
  expect(bounds.right, `${label}: right edge`).toBeLessThanOrEqual(bounds.viewportWidth + 1);
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}

async function expectStackedLayout(page: Page, containerSelector: string, childSelector: string, label: string): Promise<void> {
  const children = page.locator(containerSelector).locator(childSelector);
  await expect(children, `${label}: two rendered sections`).toHaveCount(2);
  const boxes = await children.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }));
  expect(boxes, `${label}: expected two sections`).toHaveLength(2);
  expect(boxes[1].top, `${label}: second section below first`).toBeGreaterThan(boxes[0].top);
  expect(Math.abs(boxes[1].left - boxes[0].left), `${label}: shared left edge`).toBeLessThanOrEqual(1);
}

async function expectDesktopColumns(page: Page, containerSelector: string, childSelector: string, label: string): Promise<void> {
  const children = page.locator(containerSelector).locator(childSelector);
  await expect(children, `${label}: two rendered sections`).toHaveCount(2);
  const boxes = await children.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }));
  expect(boxes, `${label}: expected two sections`).toHaveLength(2);
  expect(boxes[1].left, `${label}: second section right of first`).toBeGreaterThan(boxes[0].left);
  expect(Math.abs(boxes[1].top - boxes[0].top), `${label}: aligned top edge`).toBeLessThanOrEqual(1);
}

test.describe('Q3 실제 public runtime storefront', () => {
  test('mobile: 가입 로그인 세션 카탈로그 필터 상세와 기본 접근성', async ({ page }, testInfo) => {
    const diagnostics = observeBrowser(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/signup');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '기본 탐색' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('실제 카드 정보는 받지 않습니다.');
    await page.getByLabel('아이디').focus();
    await expect(page.getByLabel('아이디')).toBeFocused();
    await page.getByRole('link', { name: '본문으로 건너뛰기' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();

    await registerAndLogin(page, MOBILE_MEMBER, true);
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: '상품 목록' })).toBeVisible();
    await page.getByRole('combobox', { name: '브랜드' }).selectOption({ label: 'E2E-Pet-Brand' });
    await page.getByRole('button', { name: '적용', exact: true }).click();
    await expect(page).toHaveURL(/brandId=/);
    await expect(page.getByRole('link', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(2);
    await expectNoHorizontalOverflow(page, 'mobile catalog');
    await expectWithinViewport(page, '.site-header', 'mobile header');
    await expectWithinViewport(page, '.site-navigation', 'mobile navigation');
    await expectWithinViewport(page, '.product-card', 'mobile catalog card');
    const mobileHeader = await page.locator('.site-header__content').evaluate((element) => getComputedStyle(element).flexWrap);
    const mobileNavigation = await page.locator('.site-navigation').evaluate((element) => ({ order: getComputedStyle(element).order, width: element.getBoundingClientRect().width, parentWidth: element.parentElement?.getBoundingClientRect().width ?? 0 }));
    const mobileCards = await page.locator('.product-card').evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    }));
    expect(mobileHeader, 'mobile header wrapping').toBe('wrap');
    expect(mobileNavigation.order, 'mobile navigation order').toBe('3');
    expect(mobileNavigation.width, 'mobile navigation full row').toBeGreaterThanOrEqual(mobileNavigation.parentWidth - 1);
    expect(mobileCards, 'mobile catalog cards').toHaveLength(2);
    expect(mobileCards[1].top, 'mobile cards stack').toBeGreaterThan(mobileCards[0].top);
    expect(Math.abs(mobileCards[1].left - mobileCards[0].left), 'mobile card alignment').toBeLessThanOrEqual(1);
    await page.getByRole('link', { name: 'E2E Salmon Food', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expectNoHorizontalOverflow(page, 'mobile product detail');
    await attachScreenshot(page, testInfo, 'mobile-product-detail.png');
    expectNoBrowserErrors(diagnostics);
  });

  test('desktop: 좋아요, 복수 items 주문, 스냅샷/DEMO 결제 terminal poll, 로그아웃 보호', async ({ page }, testInfo) => {
    const diagnostics = observeBrowser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await registerAndLogin(page, DESKTOP_MEMBER);

    await page.goto('/products');
    await expect(page.getByRole('link', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'desktop catalog');
    const desktopCards = await page.locator('.product-card').evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    }));
    expect(desktopCards, 'desktop catalog cards').toHaveLength(2);
    expect(desktopCards[1].left, 'desktop catalog multi-column grid').toBeGreaterThan(desktopCards[0].left);
    await page.getByRole('link', { name: 'E2E Salmon Food', exact: true }).click();
    const likeButton = page.getByRole('button', { name: '좋아요', exact: true });
    await likeButton.click();
    await expect(page.getByRole('button', { name: '좋아요 취소', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: '좋아요 취소', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/likes');
    await expect(page.getByRole('link', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '좋아요 취소', exact: true }).click();
    await expect(page.getByText('아직 좋아요한 상품이 없습니다.')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'E2E Salmon Food', exact: true })).toHaveCount(0);

    await addProductToDraft(page, 'E2E Salmon Food', '2');
    await addProductToDraft(page, 'E2E Duck Treat', '3');
    await page.getByRole('link', { name: '주문서 보기' }).click();
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();
    await expect(page.getByText('E2E Salmon Food')).toBeVisible();
    await expect(page.getByText('E2E Duck Treat')).toBeVisible();
    await expectDesktopColumns(page, '.checkout-page__layout', ':scope > *', 'desktop checkout');
    await expectNoHorizontalOverflow(page, 'desktop checkout');
    await page.setViewportSize({ width: 390, height: 844 });
    await expectStackedLayout(page, '.checkout-page__layout', ':scope > *', 'mobile checkout');
    await expectNoHorizontalOverflow(page, 'mobile checkout');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectDesktopColumns(page, '.checkout-page__layout', ':scope > *', 'desktop checkout after resize');
    await page.getByRole('button', { name: '데모 주문 만들기', exact: true }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: '주문 상세' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '상품 스냅샷' })).toBeVisible();
    await expect(page.getByText('E2E Salmon Food')).toBeVisible();
    await expect(page.getByText('E2E Duck Treat')).toBeVisible();
    await expectDesktopColumns(page, '.order-detail__layout', ':scope > section', 'desktop order detail');
    await expectNoHorizontalOverflow(page, 'desktop order detail');
    await attachScreenshot(page, testInfo, 'desktop-order-detail.png');

    await expect.poll(async () => {
      await page.reload();
      return paymentStatus(page);
    }, { timeout: 20_000, intervals: [300, 600, 1_000, 2_000] }).toBe('결제 상태: 완료');

    await page.getByRole('link', { name: '주문', exact: true }).click();
    await expect(page.getByRole('link', { name: '상세 보기', exact: true })).toBeVisible();
    await page.getByRole('link', { name: '상세 보기', exact: true }).click();
    await expect(page.getByRole('heading', { name: '주문 상세', exact: true })).toBeVisible();
    await expect(page.getByText('E2E Salmon Food')).toBeVisible();
    await expect(page.getByText('E2E Duck Treat')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expectStackedLayout(page, '.order-detail__layout', ':scope > section', 'mobile order detail');
    await expectNoHorizontalOverflow(page, 'mobile order detail');
    await attachScreenshot(page, testInfo, 'mobile-order-detail.png');

    const logoutResponse = page.waitForResponse((response) => response.request().method() === 'POST'
      && new URL(response.url()).pathname === '/api/v1/auth/logout'
      && response.status() === 204);
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await logoutResponse;
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: '로그인', exact: true })).toBeVisible();
    const protectedMutations: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/api\/v1\/products\/[^/]+\/likes$/.test(new URL(request.url()).pathname)) {
        protectedMutations.push(request.url());
      }
    });
    await page.getByRole('link', { name: '상품', exact: true }).click();
    await expect(page.getByRole('heading', { name: '상품 목록', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'E2E Salmon Food', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '좋아요', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    expect(protectedMutations).toEqual([]);
    expectNoBrowserErrors(diagnostics);
  });
});
