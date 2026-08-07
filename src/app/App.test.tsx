import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const member = {
  birthDate: '19900101',
  email: 'member01@example.com',
  loginId: 'member01',
  name: '반려인',
  phone: '010-1234-5678',
};

function response(status: number, data?: unknown): Response {
  return new Response(data === undefined ? null : JSON.stringify({ data }), {
    headers: data === undefined ? undefined : { 'content-type': 'application/json' },
    status,
  });
}

function mockApi(session: 'anonymous' | 'authenticated' = 'anonymous') {
  const fetchMock = vi.fn(async (input: URL) => {
    if (input.pathname === '/api/v1/members/me') return session === 'authenticated' ? response(200, member) : response(401);
    if (input.pathname === '/api/v1/auth/csrf') return response(200, { headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'csrf-token' });
    if (input.pathname === '/api/v1/auth/logout') return response(204);
    if (input.pathname === '/api/v1/products') return response(200, { hasNext: false, items: [], page: 0, size: 12, totalElements: 0, totalPages: 0 });
    if (input.pathname === '/api/v1/brands' || input.pathname === '/api/v1/categories') return response(200, { items: [] });
    if (input.pathname === '/api/v1/orders') return response(200, { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
    if (input.pathname === '/api/v1/orders/order-1') return response(200, { id: 'order-1', items: [], orderDate: '2026-08-07T00:00:00Z', orderNumber: 'O-1', status: 'COMPLETED', totalAmount: 1000 });
    if (input.pathname === '/api/v1/payments') return response(200, { orderId: 'order-1', status: 'SUCCEEDED', updatedAt: '2026-08-07T00:00:00Z' });
    if (input.pathname === '/api/v1/products/product-1') return response(200, { brandId: 'brand-1', categoryId: 'category-1', id: 'product-1', likeCount: 0, name: '테스트 상품', price: 1000, stock: 3 });
    return response(404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('App', () => {
  it('renders_anonymousShell_withSemanticLandmarksAndRealAuthNavigation', async () => {
    mockApi();
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '기본 탐색' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('DEMO 서비스 · 실제 카드 정보는 받지 않습니다.');
    const skipLink = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    fireEvent.click(skipLink);
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(await screen.findByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
    expect(screen.queryByRole('link', { name: '좋아요' })).not.toBeInTheDocument();
  });

  it('renders_authenticatedNavigation_andResetsSessionAfterLogout', async () => {
    const fetchMock = mockApi('authenticated');
    render(<App />);

    expect(await screen.findByRole('link', { name: '좋아요' })).toHaveAttribute('href', '/likes');
    expect(screen.getByRole('link', { name: '주문' })).toHaveAttribute('href', '/orders');
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
    expect(fetchMock).toHaveBeenCalledWith(new URL('/api/v1/auth/logout', window.location.origin), expect.objectContaining({ method: 'POST' }));
    expect(window.location.pathname).toBe('/');
  });

  it.each([
    ['/', '상품 목록'],
    ['/products', '상품 목록'],
    ['/products/product-1', '테스트 상품'],
    ['/signup', '회원가입'],
    ['/login', '로그인'],
    ['/orders/new', '주문서'],
    ['/orders', '주문 내역'],
    ['/orders/order-1', '주문 상세'],
    ['/not-a-route', '페이지를 찾을 수 없습니다'],
  ])('renders_verifiedRoute_withFocusedHeading(%s)', async (path, heading) => {
    mockApi();
    window.history.replaceState({}, '', path);
    render(<App />);

    const routeHeading = await screen.findByRole('heading', { name: heading });
    await waitFor(() => expect(document.activeElement).toBe(routeHeading));
  });

  it('renders_likesRoute_withItsLoginRequirement', async () => {
    mockApi();
    window.history.replaceState({}, '', '/likes');
    render(<App />);

    expect(await screen.findByText('좋아요를 보려면 로그인해 주세요.')).toBeInTheDocument();
  });

  it('has_noDeadAnchorHashes_exceptTheSkipLink', async () => {
    mockApi();
    render(<App />);

    await screen.findByRole('link', { name: '로그인' });
    expect(document.querySelectorAll('a[href^="#"]')).toHaveLength(1);
  });
});
