import { useState, type PropsWithChildren } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../../features/session';
import { Button, Container } from './primitives';

const primaryNavigation = [
  { label: '상품', to: '/products' },
  { label: '좋아요', to: '/likes' },
  { label: '주문', to: '/orders' },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const session = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();
  const navigation = session.status === 'authenticated' ? primaryNavigation : primaryNavigation.slice(0, 1);

  async function logout() {
    setIsLoggingOut(true);
    setLogoutError(undefined);
    try {
      await session.logout();
      navigate('/', { replace: true });
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <Container className="site-header__content">
        <NavLink aria-label="반려꾸러미 홈" className="brand" to="/">
          <span className="brand__name">반려꾸러미</span>
          <span className="brand__english">BANRYEO KKURUMI</span>
        </NavLink>
        <nav aria-label="기본 탐색" className="site-navigation">
          {navigation.map(({ label, to }) => (
            <NavLink className={({ isActive }) => `site-navigation__link${isActive ? ' is-active' : ''}`} key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <div className="site-header__account">
          {session.status === 'checking' ? <span aria-live="polite" className="site-header__session-status">세션 확인 중</span> : null}
          {session.status === 'authenticated' ? (
            <>
              <span className="site-header__member">{session.member.name}님</span>
              <Button className="site-header__auth" disabled={isLoggingOut} onClick={() => { void logout(); }}>
                {isLoggingOut ? '로그아웃 중' : '로그아웃'}
              </Button>
            </>
          ) : null}
          {session.status === 'anonymous' || session.status === 'error' ? (
            <div className="site-header__auth-actions">
              <NavLink className="site-header__signup" to="/signup">회원가입</NavLink>
              <NavLink className="site-header__auth" to="/login">로그인</NavLink>
            </div>
          ) : null}
        </div>
        {logoutError ? <p className="site-header__logout-error" role="alert">{logoutError}</p> : null}
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__content">
        <p><strong>반려꾸러미 DEMO 서비스</strong> · 실제 카드 정보는 받지 않습니다.</p>
        <small>주문과 데모 결제 상태는 실제 API에서 확인합니다.</small>
      </Container>
    </footer>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  function focusMainContent() {
    document.getElementById('main-content')?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={focusMainContent}>본문으로 건너뛰기</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </div>
  );
}
