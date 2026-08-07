import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProducts, priceText, type ProductList } from './catalog-api';
import { catalogResultSummary } from '../../pages/CatalogPage';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify({ data: body }), { status: 200, headers: { 'content-type': 'application/json' } });
}

afterEach(() => vi.unstubAllGlobals());

describe('catalog-api', () => {
  it('getProducts_filtersAndCursor_usePublicCatalogQueryContract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false }));
    vi.stubGlobal('fetch', fetchMock);

    await getProducts({ brandId: 'brand-1', categoryId: 'category-1', cursor: 'cursor-1', maxPrice: 20000, minPrice: 1000, sort: 'PRICE_ASC' });

    const requested = fetchMock.mock.calls[0][0] as URL;
    expect(requested.pathname).toBe('/api/v1/products');
    expect(Object.fromEntries(requested.searchParams)).toEqual({ brandId: 'brand-1', categoryId: 'category-1', cursor: 'cursor-1', maxPrice: '20000', minPrice: '1000', size: '12', sort: 'PRICE_ASC', useCursor: 'true' });
  });

  it('priceText_krwPrice_formatsWithoutFraction', () => {
    expect(priceText(12000)).toContain('12,000');
  });

  it('catalogResultSummary_actualCursorResponseWithoutGlobalPagination_isHonestAboutVisibleItems', () => {
    const cursorResponse: ProductList = {
      hasNext: true,
      items: [{ brandId: 'brand-1', categoryId: 'category-1', id: 'product-1', likeCount: 0, name: '간식', price: 12000, stock: 3 }],
      size: 12,
    };

    expect(catalogResultSummary(cursorResponse)).toBe('현재 1개 상품을 표시 중입니다.');
  });
});
