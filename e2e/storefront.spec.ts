import { expect, test, type Page } from '@playwright/test';

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

async function registerAndLogin(page: Page, member: typeof MOBILE_MEMBER): Promise<void> {
  await page.goto('/signup');
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

test.describe('Q3 실제 public runtime storefront', () => {
  test('mobile: 가입 로그인 세션 카탈로그 필터 상세와 기본 접근성', async ({ page }) => {
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

    await registerAndLogin(page, MOBILE_MEMBER);
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: '상품 목록' })).toBeVisible();
    await page.getByRole('combobox', { name: '브랜드' }).selectOption({ label: 'E2E-Pet-Brand' });
    await page.getByRole('button', { name: '적용', exact: true }).click();
    await expect(page.getByRole('link', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'E2E Salmon Food', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'E2E Salmon Food', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('desktop: 좋아요, 복수 items 주문, 스냅샷/DEMO 결제 terminal poll, 로그아웃 보호', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await registerAndLogin(page, DESKTOP_MEMBER);

    await page.goto('/products');
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
    await page.getByRole('button', { name: '데모 주문 만들기', exact: true }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: '주문 상세' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '상품 스냅샷' })).toBeVisible();
    await expect(page.getByText('E2E Salmon Food')).toBeVisible();
    await expect(page.getByText('E2E Duck Treat')).toBeVisible();

    await expect.poll(async () => {
      await page.reload();
      return paymentStatus(page);
    }, { timeout: 20_000, intervals: [300, 600, 1_000, 2_000] }).toBe('결제 상태: 완료');

    await page.getByRole('link', { name: '주문', exact: true }).click();
    await expect(page.getByRole('link', { name: '상세 보기', exact: true })).toBeVisible();
    await page.getByRole('link', { name: '상세 보기', exact: true }).click();
    await expect(page.getByText('E2E Salmon Food')).toBeVisible();
    await expect(page.getByText('E2E Duck Treat')).toBeVisible();

    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await expect(page.getByRole('link', { name: '로그인', exact: true })).toBeVisible();
    const protectedMutations: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/api\/v1\/products\/[^/]+\/likes$/.test(new URL(request.url()).pathname)) {
        protectedMutations.push(request.url());
      }
    });
    await page.goto('/products/22222222-2222-4222-8222-222222222222');
    await page.getByRole('button', { name: '좋아요', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    expect(protectedMutations).toEqual([]);
  });
});
