import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { Container } from './primitives';

const primaryNavigation = [
  { label: '상품', to: '/products' },
  { label: '좋아요', to: '/likes' },
  { label: '주문', to: '/orders' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Container className="site-header__content">
        <NavLink aria-label="반려꾸러미 홈" className="brand" to="/">
          <span className="brand__name">반려꾸러미</span>
          <span className="brand__english">BANRYEO KKURUMI</span>
        </NavLink>
        <nav aria-label="기본 탐색" className="site-navigation">
          {primaryNavigation.map(({ label, to }) => (
            <NavLink className={({ isActive }) => `site-navigation__link${isActive ? ' is-active' : ''}`} key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <NavLink className="site-header__auth" to="/login">로그인</NavLink>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__content">
        <p><strong>반려꾸러미 DEMO 서비스</strong> · 실제 카드 정보는 받지 않습니다.</p>
        <small>주문과 결제 상태는 실제 API 연결이 완료되는 대로 안내합니다.</small>
      </Container>
    </footer>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </div>
  );
}
