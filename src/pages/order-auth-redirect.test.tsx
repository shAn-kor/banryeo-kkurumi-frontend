import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import { createOrder, getOrder, listOrders } from '../features/orders/api';
import { writeCheckoutDraft } from '../features/orders/draft';
import { getPayment } from '../features/payment/api';
import CheckoutPage from './CheckoutPage';
import OrderDetailPage from './OrderDetailPage';
import OrdersPage from './OrdersPage';

vi.mock('../features/orders/api', () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn(),
  listOrders: vi.fn(),
}));

vi.mock('../features/payment/api', () => ({ getPayment: vi.fn() }));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function PageRoute({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}<LocationProbe /></>;
}

function renderRoute(path: string, element: ReactNode, routePath: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PageRoute>{element}</PageRoute>} path={routePath} />
        <Route element={<LocationProbe />} path="/login" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('order authentication redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('CheckoutPage_createOrderUnauthorized_movesToLoginWithCurrentReturnPath', async () => {
    writeCheckoutDraft([{ productId: 'product-1', name: '사료', price: 1000, quantity: 1 }]);
    vi.mocked(createOrder).mockRejectedValue(new ApiError('unauthorized', 401));
    renderRoute('/orders/new?source=detail', <CheckoutPage />, '/orders/new');

    fireEvent.click(screen.getByRole('button', { name: '데모 주문 만들기' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login?returnTo=%2Forders%2Fnew%3Fsource%3Ddetail'));
  });

  it('OrdersPage_listUnauthorized_movesToLoginWithCurrentReturnPath', async () => {
    vi.mocked(listOrders).mockRejectedValue(new ApiError('unauthorized', 401));
    renderRoute('/orders?period=recent', <OrdersPage />, '/orders');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login?returnTo=%2Forders%3Fperiod%3Drecent'));
  });

  it('OrderDetailPage_getOrderUnauthorized_movesToLoginWithCurrentReturnPath', async () => {
    vi.mocked(getOrder).mockRejectedValue(new ApiError('unauthorized', 401));
    vi.mocked(getPayment).mockResolvedValue({ orderId: 'order-1', status: 'PENDING', updatedAt: '2026-08-07T10:00:00Z' });
    renderRoute('/orders/order-1?from=list', <OrderDetailPage />, '/orders/:orderId');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login?returnTo=%2Forders%2Forder-1%3Ffrom%3Dlist'));
    expect(screen.queryByText('주문 상세를 불러오지 못했습니다. 주문 소유권과 로그인 상태를 확인해 주세요.')).not.toBeInTheDocument();
  });

  it('OrderDetailPage_paymentUnauthorized_movesToLoginWithoutGenericOrderError', async () => {
    vi.mocked(getOrder).mockResolvedValue({ id: 'order-1', orderNumber: 'O-1', orderDate: '2026-08-07T10:00:00Z', status: 'ORDERED', totalAmount: 1000, items: [] });
    vi.mocked(getPayment).mockRejectedValue(new ApiError('unauthorized', 401));
    renderRoute('/orders/order-1?from=list', <OrderDetailPage />, '/orders/:orderId');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login?returnTo=%2Forders%2Forder-1%3Ffrom%3Dlist'));
    expect(screen.queryByText('주문 상세를 불러오지 못했습니다. 주문 소유권과 로그인 상태를 확인해 주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('데모 결제 상태를 지금 확인하지 못했습니다. 주문 상태와 별도로 나중에 주문 내역에서 다시 확인해 주세요.')).not.toBeInTheDocument();
  });
});
