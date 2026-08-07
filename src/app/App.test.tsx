import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('App', () => {
  it('renders_routerShell_withSemanticLandmarksAndSkipLink', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '기본 탐색' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('heading', { name: '반려생활에 필요한 것을 정성껏' })).toBeInTheDocument();
  });

  it('renders_placeholderRoute_withRealNavigationOnly', () => {
    window.history.replaceState({}, '', '/products');
    render(<App />);

    expect(screen.getByRole('heading', { name: '상품 목록' })).toBeInTheDocument();
    expect(screen.getByText('상품 목록 콘텐츠를 준비하고 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
    expect(document.querySelectorAll('a[href^="#"]')).toHaveLength(1);
  });

  it('renders_notFoundBoundary_forUnknownRoutes', () => {
    window.history.replaceState({}, '', '/not-a-route');
    render(<App />);

    expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
  });

  it('discloses_demoAndNoRealCardData_inFooter', () => {
    render(<App />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent('DEMO 서비스 · 실제 카드 정보는 받지 않습니다.');
  });
});
