import { apiClient } from '../../api/client';

export type NamedReference = Readonly<{ id: string; name: string }>;

export type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string | null;
  categoryId: string;
  category?: NamedReference | null;
  brandId: string;
  brand?: NamedReference | null;
  imageUrl?: string | null;
  likeCount: number;
}>;

export type ProductList = Readonly<{
  items: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext?: boolean;
  nextCursor?: string | null;
}>;

export type CatalogQuery = Readonly<{
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  size?: number;
  cursor?: string;
}>;

function queryString(input: CatalogQuery): string {
  const query = new URLSearchParams({ useCursor: 'true', size: String(input.size ?? 12) });
  if (input.brandId) query.set('brandId', input.brandId);
  if (input.categoryId) query.set('categoryId', input.categoryId);
  if (input.minPrice !== undefined) query.set('minPrice', String(input.minPrice));
  if (input.maxPrice !== undefined) query.set('maxPrice', String(input.maxPrice));
  if (input.sort) query.set('sort', input.sort);
  if (input.cursor) query.set('cursor', input.cursor);
  return query.toString();
}

export function getProducts(query: CatalogQuery): Promise<ProductList> {
  return apiClient.request<ProductList>(`/api/v1/products?${queryString(query)}`);
}

export function getProduct(productId: string): Promise<Product> {
  return apiClient.request<Product>(`/api/v1/products/${encodeURIComponent(productId)}`);
}

export function getBrands(): Promise<Readonly<{ items: NamedReference[] }>> {
  return apiClient.request('/api/v1/brands');
}

export function getCategories(): Promise<Readonly<{ items: NamedReference[] }>> {
  return apiClient.request('/api/v1/categories');
}

export function priceText(price: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(price);
}
