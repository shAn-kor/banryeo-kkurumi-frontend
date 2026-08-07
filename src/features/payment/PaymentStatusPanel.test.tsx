import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PaymentStatusPanel } from './PaymentStatusPanel';

describe('PaymentStatusPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ['PENDING', '처리 중'],
    ['SUCCEEDED', '완료'],
    ['FAILED', '실패'],
    ['UNEXPECTED', '상태 확인 필요'],
  ])('renders_status_%s_withSafePresentation', (status, label) => {
    render(<PaymentStatusPanel payment={{ orderId: 'order-a', status, updatedAt: '2026-08-07T10:00:00Z' }} />);

    expect(screen.getByRole('heading', { name: `결제 상태: ${label}` })).toBeInTheDocument();
    expect(screen.getByText('실제 카드 정보는 입력하거나 저장하지 않습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
