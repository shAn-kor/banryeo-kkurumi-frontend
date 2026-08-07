import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { paymentPresentation } from '../shared/payment-status';

describe('App', () => {
  it('render_foundationShell_hasSemanticLandmarksAndAccessibleStatusPrimitives', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute('href', '#main-content');
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByText('DEMO 결제')).toBeInTheDocument();
  });

  it.each([
    'REQUESTED', 'SUCCEEDED', 'FAILED', 'CANCEL_REQUESTED', 'CANCEL_RECONCILE_REQUIRED', 'CANCELLED', 'CANCEL_FAILED',
  ])('paymentPresentation_knownE0Status_returnsPresentation(%s)', (status) => {
    expect(paymentPresentation(status).label).not.toBe('상태 확인 중');
  });

  it('paymentPresentation_unknownStatus_returnsSafeFallback', () => {
    expect(paymentPresentation('UNRECOGNIZED').label).toBe('상태 확인 중');
  });
});
