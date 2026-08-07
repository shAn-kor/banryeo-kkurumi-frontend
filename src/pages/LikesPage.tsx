import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { type ProductList } from '../features/catalog';
import { getMyLikes, removeLike } from '../features/likes';
import { loginPathFor, useSession } from '../features/session';
import { Button, Container, Page, Section } from '../shared/design';
import { EmptyState, ErrorState, LoadingState } from '../shared/states';
import { ProductCard } from './CatalogPage';
import './storefront-pages.css';

export default function LikesPage() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [likes, setLikes] = useState<ProductList>();
  const [error, setError] = useState<string>();
  const [removingId, setRemovingId] = useState<string>();

  const refresh = useCallback(async () => {
    setLikes(undefined); setError(undefined);
    try { setLikes(await getMyLikes()); }
    catch (caught) {
      if (caught instanceof ApiError && caught.kind === 'unauthorized') { navigate(loginPathFor(`${location.pathname}${location.search}`), { replace: true }); return; }
      setError('좋아요 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => { if (session.status === 'authenticated') void refresh(); }, [refresh, session.status]);

  async function unlike(productId: string) {
    setRemovingId(productId); setError(undefined);
    try { await removeLike(productId); await refresh(); }
    catch (caught) {
      if (caught instanceof ApiError && caught.kind === 'unauthorized') { navigate(loginPathFor(`${location.pathname}${location.search}`)); return; }
      setError('좋아요를 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally { setRemovingId(undefined); }
  }

  return <Page><Container><Section className="storefront-page" labelledBy="likes-title"><p className="page-kicker">MY LIST</p><h1 className="storefront-page__heading" id="likes-title">좋아요</h1><p className="storefront-page__intro">마음에 든 상품을 다시 확인해 보세요.</p>
    {session.status === 'checking' && <LoadingState />}
    {session.status === 'anonymous' && <ErrorState>좋아요를 보려면 로그인해 주세요. <Link className="inline-link" to={loginPathFor('/likes')}>로그인</Link></ErrorState>}
    {session.status === 'error' && <ErrorState>로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.</ErrorState>}
    {session.status === 'authenticated' && <>{!likes && !error && <LoadingState />}{error && <ErrorState>{error}</ErrorState>}{likes && likes.items.length === 0 && <EmptyState>아직 좋아요한 상품이 없습니다. <Link className="inline-link" to="/products">상품 둘러보기</Link></EmptyState>}{likes && likes.items.length > 0 && <div className="storefront-grid">{likes.items.map((product) => <div key={product.id}><ProductCard product={product} /><Button disabled={removingId === product.id} onClick={() => { void unlike(product.id); }} tone="secondary">{removingId === product.id ? '처리 중' : '좋아요 취소'}</Button></div>)}</div>}</>}
  </Section></Container></Page>;
}
