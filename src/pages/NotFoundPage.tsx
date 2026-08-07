import { Link } from 'react-router-dom';
import { Container, Page, Section } from '../shared/design';
import './storefront-pages.css';

export default function NotFoundPage() {
  return (
    <Page>
      <Container>
        <Section className="storefront-page" labelledBy="not-found-title">
          <p className="page-kicker">404</p>
          <h1 className="storefront-page__heading" id="not-found-title">페이지를 찾을 수 없습니다</h1>
          <p className="storefront-page__intro">주소를 다시 확인하거나 상품 목록에서 필요한 메뉴를 선택해 주세요.</p>
          <Link className="text-link" to="/products">상품 목록으로 가기</Link>
        </Section>
      </Container>
    </Page>
  );
}
