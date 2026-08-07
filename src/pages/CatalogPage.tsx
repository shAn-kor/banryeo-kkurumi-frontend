import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBrands, getCategories, getProducts, priceText, type CatalogQuery, type NamedReference, type Product, type ProductList } from '../features/catalog';
import { Button, Card, Container, Page, Section, TextInput } from '../shared/design';
import { EmptyState, ErrorState, LoadingState } from '../shared/states';
import './storefront-pages.css';

function value(search: URLSearchParams, key: string): string | undefined {
  const result = search.get(key);
  return result && result.trim() ? result : undefined;
}

function numberValue(search: URLSearchParams, key: string): number | undefined {
  const result = value(search, key);
  if (!result) return undefined;
  const parsed = Number(result);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function catalogQuery(search: URLSearchParams): CatalogQuery {
  return {
    brandId: value(search, 'brandId'),
    categoryId: value(search, 'categoryId'),
    cursor: value(search, 'cursor'),
    maxPrice: numberValue(search, 'maxPrice'),
    minPrice: numberValue(search, 'minPrice'),
    size: 12,
    sort: value(search, 'sort'),
  };
}

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  return (
    <Card className="product-card">
      {product.imageUrl ? <img alt={`${product.name} 상품 이미지`} className="product-card__image" src={product.imageUrl} /> : <div aria-label="상품 이미지 없음" className="product-image-placeholder" role="img">이미지 준비 중</div>}
      <div className="product-card__body">
        <span className="product-card__brand">{product.brand?.name ?? '브랜드 정보 없음'}</span>
        <Link className="product-card__name" to={`/products/${product.id}`}>{product.name}</Link>
        <span className="product-card__price">{priceText(product.price)}</span>
        <span className="product-card__meta">좋아요 {product.likeCount.toLocaleString('ko-KR')} · 재고 {product.stock.toLocaleString('ko-KR')}</span>
      </div>
    </Card>
  );
}

function CatalogFilters({ brands, categories, search, setSearch }: Readonly<{ brands: NamedReference[]; categories: NamedReference[]; search: URLSearchParams; setSearch: (search: URLSearchParams) => void }>) {
  const [draft, setDraft] = useState(() => ({ brandId: value(search, 'brandId') ?? '', categoryId: value(search, 'categoryId') ?? '', maxPrice: value(search, 'maxPrice') ?? '', minPrice: value(search, 'minPrice') ?? '', sort: value(search, 'sort') ?? '' }));

  useEffect(() => setDraft({ brandId: value(search, 'brandId') ?? '', categoryId: value(search, 'categoryId') ?? '', maxPrice: value(search, 'maxPrice') ?? '', minPrice: value(search, 'minPrice') ?? '', sort: value(search, 'sort') ?? '' }), [search]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    Object.entries(draft).forEach(([key, item]) => { if (item) next.set(key, item); });
    setSearch(next);
  }

  return <form aria-label="상품 필터" className="catalog-filter" onSubmit={submit}>
    <label>카테고리<select className="ds-input" onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} value={draft.categoryId}><option value="">전체 카테고리</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label>브랜드<select className="ds-input" onChange={(event) => setDraft({ ...draft, brandId: event.target.value })} value={draft.brandId}><option value="">전체 브랜드</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
    <label>최소 가격<TextInput inputMode="numeric" min="0" onChange={(event) => setDraft({ ...draft, minPrice: event.target.value })} type="number" value={draft.minPrice} /></label>
    <label>최대 가격<TextInput inputMode="numeric" min="0" onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value })} type="number" value={draft.maxPrice} /></label>
    <label>정렬<select className="ds-input" onChange={(event) => setDraft({ ...draft, sort: event.target.value })} value={draft.sort}><option value="">기본 정렬</option><option value="LATEST">최신순</option><option value="PRICE_ASC">낮은 가격순</option><option value="PRICE_DESC">높은 가격순</option></select></label>
    <div className="catalog-filter__actions"><Button type="submit">적용</Button><Button onClick={() => { setDraft({ brandId: '', categoryId: '', maxPrice: '', minPrice: '', sort: '' }); setSearch(new URLSearchParams()); }} tone="secondary">초기화</Button></div>
  </form>;
}

export default function CatalogPage() {
  const [search, setSearch] = useSearchParams();
  const query = useMemo(() => catalogQuery(search), [search]);
  const [products, setProducts] = useState<ProductList>();
  const [references, setReferences] = useState<Readonly<{ brands: NamedReference[]; categories: NamedReference[] }>>({ brands: [], categories: [] });
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setProducts(undefined); setError(false);
    void getProducts(query).then((response) => { if (current) setProducts(response); }).catch(() => { if (current) setError(true); });
    void Promise.all([getBrands(), getCategories()]).then(([brands, categories]) => { if (current) setReferences({ brands: brands.items, categories: categories.items }); }).catch(() => { if (current) setReferences({ brands: [], categories: [] }); });
    return () => { current = false; };
  }, [query]);

  function nextPage() {
    if (!products?.nextCursor) return;
    const next = new URLSearchParams(search);
    next.set('cursor', products.nextCursor);
    setSearch(next);
  }

  return <Page><Container><Section className="storefront-page" labelledBy="catalog-title">
    <p className="page-kicker">SHOP</p><h1 className="storefront-page__heading" id="catalog-title">상품 목록</h1><p className="storefront-page__intro">필요한 반려생활 용품을 찾아보세요.</p>
    <CatalogFilters brands={references.brands} categories={references.categories} search={search} setSearch={setSearch} />
    {!products && !error && <LoadingState />}{error && <ErrorState>상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</ErrorState>}
    {products && products.items.length === 0 && <EmptyState>조건에 맞는 상품이 없습니다. 필터를 조정해 주세요.</EmptyState>}
    {products && products.items.length > 0 && <><p aria-live="polite" className="product-card__meta">총 {products.totalElements.toLocaleString('ko-KR')}개 상품</p><div className="storefront-grid">{products.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>{products.hasNext && products.nextCursor && <div className="catalog-pagination"><Button onClick={nextPage}>다음 상품 보기</Button></div>}</>}
  </Section></Container></Page>;
}
