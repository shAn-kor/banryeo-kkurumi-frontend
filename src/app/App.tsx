import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell, Card, Container, Notice, Page, Section } from '../shared/design';
import './styles.css';

const routeLabels = {
  '/products': '상품 목록',
  '/likes': '좋아요',
  '/orders': '주문',
  '/login': '로그인',
} as const;

function HomeRoute() {
  return (
    <Page>
      <Container>
        <Section className="home-hero" labelledBy="home-title">
          <p className="page-kicker">BANRYEO KKURUMI</p>
          <h1 id="home-title">반려생활에 필요한 것을 정성껏</h1>
          <p className="home-hero__description">상품 탐색부터 주문 상태 확인까지, 실제 API와 연결되는 쇼핑 경험을 준비하고 있습니다.</p>
        </Section>
        <Section ariaLabel="서비스 안내">
          <Card>
            <h2>서비스 준비 중</h2>
            <p>회원 접근, 상품 탐색, 좋아요, 주문 흐름은 검증된 API 계약에 맞춰 순차적으로 연결됩니다.</p>
          </Card>
        </Section>
      </Container>
    </Page>
  );
}

function PreparedRoute({ title }: { title: string }) {
  return (
    <Page>
      <Container>
        <Section className="route-placeholder" labelledBy="route-title">
          <p className="page-kicker">BANRYEO KKURUMI</p>
          <h1 id="route-title">{title}</h1>
          <Notice> {title} 콘텐츠를 준비하고 있습니다.</Notice>
          <Link className="text-link" to="/">홈으로 돌아가기</Link>
        </Section>
      </Container>
    </Page>
  );
}

function NotFoundRoute() {
  return (
    <Page>
      <Container>
        <Section className="route-placeholder" labelledBy="not-found-title">
          <p className="page-kicker">404</p>
          <h1 id="not-found-title">페이지를 찾을 수 없습니다</h1>
          <p>주소를 다시 확인하거나 홈에서 필요한 메뉴를 선택해 주세요.</p>
          <Link className="text-link" to="/">홈으로 돌아가기</Link>
        </Section>
      </Container>
    </Page>
  );
}

function StorefrontRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        {Object.entries(routeLabels).map(([path, title]) => <Route element={<PreparedRoute title={title} />} key={path} path={path} />)}
        <Route element={<NotFoundRoute />} path="*" />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return <BrowserRouter><StorefrontRoutes /></BrowserRouter>;
}
