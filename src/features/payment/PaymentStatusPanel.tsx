import { Card } from '../../shared/design';
import type { PublicPayment } from './api';
import './payment.css';

type PaymentPresentation = Readonly<{
  label: string;
  message: string;
  tone: 'pending' | 'success' | 'failure' | 'unknown';
}>;

function presentation(status: string): PaymentPresentation {
  if (status === 'PENDING') return { label: '처리 중', message: '데모 결제 상태를 확인하고 있어요.', tone: 'pending' };
  if (status === 'SUCCEEDED') return { label: '완료', message: '데모 결제가 완료되었어요.', tone: 'success' };
  if (status === 'FAILED') return { label: '실패', message: '데모 결제가 완료되지 않았어요.', tone: 'failure' };
  return { label: '상태 확인 필요', message: '알 수 없는 데모 결제 상태입니다. 잠시 후 주문 내역에서 다시 확인해 주세요.', tone: 'unknown' };
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function PaymentStatusPanel({ payment }: Readonly<{ payment: PublicPayment }>) {
  const state = presentation(payment.status);
  return (
    <Card className="payment-status" data-tone={state.tone}>
      <p className="payment-status__eyebrow">DEMO 결제</p>
      <h2>결제 상태: {state.label}</h2>
      <p>{state.message}</p>
      {payment.reason ? <p className="payment-status__reason">안내: {payment.reason}</p> : null}
      <p className="payment-status__updated">마지막 확인: {formatUpdatedAt(payment.updatedAt)}</p>
      <small>실제 카드 정보는 입력하거나 저장하지 않습니다.</small>
    </Card>
  );
}
