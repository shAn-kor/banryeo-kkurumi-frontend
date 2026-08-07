import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Notice, Page, Section } from '../shared/design';
import { createOrder } from '../features/orders/api';
import { clearCheckoutDraft, readCheckoutDraft, toOrderItems, writeCheckoutDraft, type CheckoutDraftItem } from '../features/orders/draft';
import { formatAmount } from '../features/orders/presentation';
import './checkout.css';

function totalAmount(items: CheckoutDraftItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CheckoutDraftItem[]>(readCheckoutDraft);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateItems = (nextItems: CheckoutDraftItem[]) => {
    setItems(nextItems);
    writeCheckoutDraft(nextItems);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    updateItems(items.map((item) => item.productId === productId ? { ...item, quantity } : item));
  };

  const removeItem = (productId: string) => updateItems(items.filter((item) => item.productId !== productId));

  const submit = async () => {
    if (isSubmitting) return;
    if (items.length === 0) {
      setError('주문할 상품을 먼저 담아 주세요.');
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      const order = await createOrder(toOrderItems(items));
      clearCheckoutDraft();
      setItems([]);
      navigate(`/orders/${order.id}`);
    } catch {
      setError('주문을 만들지 못했습니다. 로그인 상태와 상품 재고를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Container>
        <Section className="checkout-page" labelledBy="checkout-title">
          <p className="page-kicker">ORDER</p>
          <h1 id="checkout-title">주문서</h1>
          <Notice>DEMO 주문입니다. 실제 카드 정보를 입력하거나 저장하지 않으며, 주문 생성 뒤 데모 결제 상태를 확인합니다.</Notice>
          {error ? <p className="checkout-page__error" role="alert">{error}</p> : null}
          {items.length === 0 ? (
            <Card className="checkout-page__empty">
              <h2>주문서가 비어 있습니다</h2>
              <p>상품 상세에서 주문할 상품과 수량을 선택해 주세요. 이 목록은 이 브라우저 탭의 임시 주문서일 뿐 서버 장바구니가 아닙니다.</p>
              <Link className="text-link" to="/products">상품 보러 가기</Link>
            </Card>
          ) : (
            <div className="checkout-page__layout">
              <section aria-labelledby="checkout-items-title">
                <h2 id="checkout-items-title">주문 상품</h2>
                <ul className="checkout-items">
                  {items.map((item) => (
                    <li key={item.productId}>
                      <Card>
                        <div className="checkout-item__copy">
                          <strong>{item.name}</strong>
                          <span>{formatAmount(item.price)} · 수량 {item.quantity}개</span>
                        </div>
                        <label className="checkout-item__quantity" htmlFor={`quantity-${item.productId}`}>
                          수량
                          <input id={`quantity-${item.productId}`} min="1" onChange={(event) => updateQuantity(item.productId, Number(event.target.value))} type="number" value={item.quantity} />
                        </label>
                        <Button onClick={() => removeItem(item.productId)} tone="secondary">삭제</Button>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
              <Card className="checkout-summary">
                <h2>주문 요약</h2>
                <p>총 {items.length}종 · {items.reduce((count, item) => count + item.quantity, 0)}개</p>
                <strong>{formatAmount(totalAmount(items))}</strong>
                <Button disabled={isSubmitting} onClick={() => void submit()}>{isSubmitting ? '주문 생성 중' : '데모 주문 만들기'}</Button>
                {isSubmitting ? <p role="status">주문을 만들고 있습니다.</p> : null}
              </Card>
            </div>
          )}
        </Section>
      </Container>
    </Page>
  );
}
