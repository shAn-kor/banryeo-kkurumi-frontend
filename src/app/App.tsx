import { DemoPaymentStatusNotice } from '../shared/payment-status';
import { EmptyState, ErrorState, LoadingState, OfflineNotice } from '../shared/states';
import './styles.css';

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="반려꾸러미 홈">반려꾸러미 <span>BANRYEO KKURUMI</span></a>
        <nav aria-label="기본 탐색"><a href="#foundation">서비스 안내</a></nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="foundation-title">
          <p className="eyebrow">STORE FRONT FOUNDATION</p>
          <h1 id="foundation-title">반려생활에 필요한 것을 정성껏</h1>
          <p>반려꾸러미의 안전하고 접근 가능한 쇼핑 경험을 준비하고 있습니다.</p>
        </section>
        <section id="foundation" className="foundation-grid" aria-label="서비스 준비 상태">
          <DemoPaymentStatusNotice status="REQUESTED" />
          <div className="state-stack" aria-label="공통 상태 표현">
            <LoadingState />
            <EmptyState>아직 표시할 항목이 없습니다.</EmptyState>
            <ErrorState>요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.</ErrorState>
            <OfflineNotice />
          </div>
        </section>
      </main>
      <footer className="site-footer"><small>DEMO 서비스 · 실제 카드 정보는 받지 않습니다.</small></footer>
    </div>
  );
}
