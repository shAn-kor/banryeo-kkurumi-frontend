import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getProduct, priceText, type Product } from '../features/catalog';
import { addLike, getMyLikes, hasLiked, removeLike } from '../features/likes';
import { addCheckoutDraftItem } from '../features/orders/draft';
import { loginPathFor, useSession } from '../features/session';
import { Button, Card, Container, Page, Section } from '../shared/design';
import { ErrorState, LoadingState } from '../shared/states';
import './storefront-pages.css';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const [product, setProduct] = useState<Product>();
  const [liked, setLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [error, setError] = useState(false);
  const [likeError, setLikeError] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [draftStatus, setDraftStatus] = useState<string>();
  const [draftError, setDraftError] = useState<string>();

  useEffect(() => {
    if (!productId) { setError(true); return; }
    let current = true;
    setProduct(undefined); setError(false); setLikeError(undefined); setQuantity(1); setDraftStatus(undefined); setDraftError(undefined);
    void getProduct(productId).then((response) => { if (current) setProduct(response); }).catch(() => { if (current) setError(true); });
    if (session.status === 'authenticated') {
      void getMyLikes().then((response) => { if (current) setLiked(hasLiked(response.items, productId)); }).catch(() => { if (current) setLiked(false); });
    } else if (current) setLiked(false);
    return () => { current = false; };
  }, [productId, session.status]);

  async function toggleLike() {
    if (!product) return;
    const returnTo = `${location.pathname}${location.search}`;
    if (session.status !== 'authenticated') { navigate(loginPathFor(returnTo)); return; }
    setLoadingLike(true); setLikeError(undefined);
    try {
      if (liked) await removeLike(product.id); else await addLike(product.id);
      const refreshedLikes = await getMyLikes();
      const refreshedProduct = await getProduct(product.id);
      setLiked(hasLiked(refreshedLikes.items, product.id));
      setProduct(refreshedProduct);
    } catch (caught) {
      if (caught instanceof ApiError && caught.kind === 'unauthorized') { navigate(loginPathFor(returnTo)); return; }
      setLikeError('좋아요를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally { setLoadingLike(false); }
  }

  function addToCheckoutDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || product.stock < 1) return;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      setDraftStatus(undefined);
      setDraftError(`수량은 1개부터 재고 ${product.stock.toLocaleString('ko-KR')}개까지 선택할 수 있습니다.`);
      return;
    }
    try {
      addCheckoutDraftItem({ productId: product.id, name: product.name, price: product.price, quantity });
      setDraftError(undefined);
      setDraftStatus(`${product.name} ${quantity.toLocaleString('ko-KR')}개를 이 탭의 임시 주문서에 담았습니다.`);
    } catch {
      setDraftStatus(undefined);
      setDraftError('주문서에 담지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.');
    }
  }

  return <Page><Container><Section className="storefront-page" labelledBy="product-detail-title">
    {!product && !error && <LoadingState />}
    {error && <ErrorState>상품 정보를 불러오지 못했습니다. 상품 목록에서 다시 선택해 주세요.</ErrorState>}
    {product && <article className="product-detail">
      <div>{product.imageUrl ? <img alt={`${product.name} 상품 이미지`} className="product-detail__image" src={product.imageUrl} /> : <div aria-label="상품 이미지 없음" className="product-image-placeholder" role="img">이미지 준비 중</div>}</div>
      <Card className="product-detail__content"><p className="page-kicker">{product.brand?.name ?? '브랜드 정보 없음'}</p><h1 id="product-detail-title">{product.name}</h1><p className="product-detail__price">{priceText(product.price)}</p><p className="product-card__meta">{product.category?.name ?? '카테고리 정보 없음'} · 재고 {product.stock.toLocaleString('ko-KR')}개 · 좋아요 {product.likeCount.toLocaleString('ko-KR')}개</p><p className="product-detail__description">{product.description || '상품 상세 설명을 준비하고 있습니다.'}</p>
        <form className="product-detail__draft" onSubmit={addToCheckoutDraft}>
          <label htmlFor="order-quantity">주문 수량<input className="ds-input" disabled={product.stock < 1} id="order-quantity" max={product.stock} min="1" onChange={(event) => setQuantity(Number(event.target.value))} type="number" value={quantity} /></label>
          {product.stock < 1 ? <p className="product-card__meta">현재 재고가 없어 주문서에 담을 수 없습니다.</p> : <p className="product-card__meta">이 브라우저 탭의 임시 주문서에만 담기며, 서버 장바구니가 아닙니다.</p>}
          <Button disabled={product.stock < 1} type="submit">주문서에 담기</Button>
          {draftStatus ? <p role="status">{draftStatus} <Link className="inline-link" to="/orders/new">주문서 보기</Link></p> : null}
          {draftError ? <p role="alert">{draftError}</p> : null}
        </form>
        {likeError && <ErrorState>{likeError}</ErrorState>}<Button aria-pressed={liked} disabled={loadingLike || session.status === 'checking'} onClick={() => { void toggleLike(); }}>{loadingLike ? '좋아요 처리 중' : liked ? '좋아요 취소' : '좋아요'}</Button><Link className="inline-link" to="/products">상품 목록으로 돌아가기</Link></Card>
    </article>}
  </Section></Container></Page>;
}
