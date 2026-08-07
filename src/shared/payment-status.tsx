import type { ReactNode } from 'react';

export type DemoPaymentStatus =
  | 'REQUESTED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCEL_REQUESTED'
  | 'CANCEL_RECONCILE_REQUIRED'
  | 'CANCELLED'
  | 'CANCEL_FAILED';

type PaymentPresentation = Readonly<{ label: string; description: string; tone: 'info' | 'success' | 'warning' | 'danger' }>;

const PRESENTATIONS: Record<DemoPaymentStatus, PaymentPresentation> = {
  REQUESTED: { label: '처리 요청됨', description: '데모 결제 상태를 확인하고 있어요.', tone: 'info' },
  SUCCEEDED: { label: '완료', description: '데모 결제가 완료되었어요.', tone: 'success' },
  FAILED: { label: '실패', description: '데모 결제가 완료되지 않았어요.', tone: 'danger' },
  CANCEL_REQUESTED: { label: '취소 요청됨', description: '데모 결제 취소를 처리하고 있어요.', tone: 'warning' },
  CANCEL_RECONCILE_REQUIRED: { label: '확인 필요', description: '데모 결제 취소 결과를 확인하고 있어요.', tone: 'warning' },
  CANCELLED: { label: '취소됨', description: '데모 결제가 취소되었어요.', tone: 'info' },
  CANCEL_FAILED: { label: '취소 실패', description: '데모 결제 취소가 완료되지 않았어요.', tone: 'danger' },
};

const UNKNOWN: PaymentPresentation = { label: '상태 확인 중', description: '알 수 없는 데모 결제 상태예요. 잠시 후 다시 확인해 주세요.', tone: 'warning' };

export function paymentPresentation(status: string | null | undefined): PaymentPresentation {
  return status && status in PRESENTATIONS ? PRESENTATIONS[status as DemoPaymentStatus] : UNKNOWN;
}

export function DemoPaymentStatusNotice({ status }: Readonly<{ status?: string }>): ReactNode {
  const presentation = paymentPresentation(status);
  return (
    <section className="payment-notice" data-tone={presentation.tone} aria-label="데모 결제 상태">
      <p className="eyebrow">DEMO 결제</p>
      <strong>{presentation.label}</strong>
      <p>{presentation.description}</p>
      <small>실제 결제수단이나 카드 정보는 사용하지 않습니다.</small>
    </section>
  );
}
