import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Button, Card, Container, Page, Section } from '../shared/design';
import { listOrders } from '../features/orders/api';
import { defaultDateRange, formatAmount, formatCompactDate, formatOrderDate } from '../features/orders/presentation';
import type { OrderList } from '../features/orders/types';
import { loginPathFor } from '../features/session';
import './orders.css';

const PAGE_SIZE = 10;
const initialRange = defaultDateRange();

export default function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [orders, setOrders] = useState<OrderList>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (page: number) => {
    if (startDate > endDate) {
      setError('조회 시작일은 종료일보다 늦을 수 없습니다.');
      setIsLoading(false);
      return;
    }
    setError(undefined);
    setIsLoading(true);
    try {
      const result = await listOrders({ startAt: formatCompactDate(startDate), endAt: formatCompactDate(endDate), page, size: PAGE_SIZE });
      setOrders(result);
    } catch (caught) {
      if (caught instanceof ApiError && caught.kind === 'unauthorized') {
        navigate(loginPathFor(`${location.pathname}${location.search}`), { replace: true });
        return;
      }
      setError('주문 내역을 불러오지 못했습니다. 로그인 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [endDate, location.pathname, location.search, navigate, startDate]);

  useEffect(() => {
    void load(0);
  }, [load]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void load(0);
  };

  const currentPage = orders?.page ?? 0;
  const hasPrevious = currentPage > 0;
  const hasNext = orders ? currentPage + 1 < orders.totalPages : false;

  return (
    <Page>
      <Container>
        <Section className="orders-page" labelledBy="orders-title">
          <p className="page-kicker">MY ORDERS</p>
          <h1 id="orders-title">주문 내역</h1>
          <form className="orders-filter" onSubmit={submit}>
            <label htmlFor="orders-start-date">시작일
              <input id="orders-start-date" onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} />
            </label>
            <label htmlFor="orders-end-date">종료일
              <input id="orders-end-date" onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} />
            </label>
            <Button type="submit">기간 조회</Button>
          </form>
          <p className="orders-page__hint">조회 API에는 필수 날짜를 yyyyMMdd 형식으로 전송합니다.</p>
          {isLoading ? <p role="status">주문 내역을 불러오는 중입니다.</p> : null}
          {error ? <p className="orders-page__error" role="alert">{error}</p> : null}
          {!isLoading && !error && orders?.items.length === 0 ? <Card className="orders-page__empty"><p>선택한 기간에 주문 내역이 없습니다.</p><Link className="text-link" to="/products">상품 보러 가기</Link></Card> : null}
          {!isLoading && !error && orders?.items.length ? (
            <>
              <ul className="order-list">
                {orders.items.map((order) => (
                  <li key={order.id}>
                    <Card>
                      <div>
                        <p className="order-list__number">주문번호 {order.orderNumber}</p>
                        <strong>{formatOrderDate(order.orderDate)}</strong>
                        <p>{order.items.map((item) => item.snapshotProductName).join(', ')}</p>
                      </div>
                      <div className="order-list__meta">
                        <span>{order.status}</span>
                        <strong>{formatAmount(order.totalAmount)}</strong>
                        <Link className="text-link" to={`/orders/${order.id}`}>상세 보기</Link>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
              <nav aria-label="주문 목록 페이지" className="orders-pagination">
                <Button disabled={!hasPrevious || isLoading} onClick={() => void load(currentPage - 1)} tone="secondary">이전</Button>
                <span aria-live="polite">{currentPage + 1} / {orders.totalPages || 1} 페이지</span>
                <Button disabled={!hasNext || isLoading} onClick={() => void load(currentPage + 1)} tone="secondary">다음</Button>
              </nav>
            </>
          ) : null}
        </Section>
      </Container>
    </Page>
  );
}
