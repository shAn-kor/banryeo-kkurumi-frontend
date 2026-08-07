import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Container, Notice, Page, Section } from '../shared/design';
import { getOrder } from '../features/orders/api';
import { formatAmount, formatOrderDate } from '../features/orders/presentation';
import type { PublicOrder } from '../features/orders/types';
import { getPayment, type PublicPayment } from '../features/payment/api';
import { PaymentStatusPanel } from '../features/payment/PaymentStatusPanel';
import './order-detail.css';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<PublicOrder>();
  const [orderError, setOrderError] = useState<string>();
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const [payment, setPayment] = useState<PublicPayment>();
  const [paymentError, setPaymentError] = useState<string>();
  const [isPaymentLoading, setIsPaymentLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setOrderError('유효한 주문 번호가 없습니다.');
      setPaymentError('유효한 주문 번호가 없습니다.');
      setIsOrderLoading(false);
      setIsPaymentLoading(false);
      return;
    }
    let active = true;
    setOrderError(undefined);
    setPaymentError(undefined);
    setIsOrderLoading(true);
    setIsPaymentLoading(true);
    void getOrder(orderId)
      .then((result) => { if (active) setOrder(result); })
      .catch(() => { if (active) setOrderError('주문 상세를 불러오지 못했습니다. 주문 소유권과 로그인 상태를 확인해 주세요.'); })
      .finally(() => { if (active) setIsOrderLoading(false); });
    void getPayment(orderId)
      .then((result) => { if (active) setPayment(result); })
      .catch(() => { if (active) setPaymentError('데모 결제 상태를 지금 확인하지 못했습니다. 주문 상태와 별도로 나중에 주문 내역에서 다시 확인해 주세요.'); })
      .finally(() => { if (active) setIsPaymentLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  return (
    <Page>
      <Container>
        <Section className="order-detail" labelledBy="order-detail-title">
          <p className="page-kicker">ORDER DETAIL</p>
          <h1 id="order-detail-title">주문 상세</h1>
          <Notice>DEMO 결제에는 실제 카드 정보를 받지 않습니다.</Notice>
          <div className="order-detail__layout">
            <section aria-labelledby="order-summary-title">
              <h2 id="order-summary-title">주문 정보</h2>
              {isOrderLoading ? <p role="status">주문 상세를 불러오는 중입니다.</p> : null}
              {orderError ? <Card><p role="alert">{orderError}</p><Link className="text-link" to="/orders">주문 내역으로 돌아가기</Link></Card> : null}
              {order ? (
                <Card className="order-detail__card">
                  <dl className="order-detail__facts">
                    <div><dt>주문번호</dt><dd>{order.orderNumber}</dd></div>
                    <div><dt>주문일</dt><dd>{formatOrderDate(order.orderDate)}</dd></div>
                    <div><dt>주문 상태</dt><dd>{order.status}</dd></div>
                    <div><dt>총액</dt><dd>{formatAmount(order.totalAmount)}</dd></div>
                  </dl>
                  <h3>상품 스냅샷</h3>
                  <ul className="order-detail__items">
                    {order.items.map((item) => <li key={item.id}><strong>{item.snapshotProductName}</strong><span>{item.snapshotBrandName} · {item.quantity}개 · {formatAmount(item.snapshotPrice)}</span></li>)}
                  </ul>
                </Card>
              ) : null}
            </section>
            <section aria-labelledby="payment-summary-title">
              <h2 id="payment-summary-title">데모 결제</h2>
              {isPaymentLoading ? <p role="status">데모 결제 상태를 불러오는 중입니다.</p> : null}
              {paymentError ? <Card><p role="alert">{paymentError}</p></Card> : null}
              {payment ? <PaymentStatusPanel payment={payment} /> : null}
            </section>
          </div>
        </Section>
      </Container>
    </Page>
  );
}
