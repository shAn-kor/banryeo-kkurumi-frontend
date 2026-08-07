import { apiClient } from '../../api/client';
import type { Product, ProductList } from '../catalog';

export function getMyLikes(page = 0, size = 20): Promise<ProductList> {
  return apiClient.request(`/api/v1/me/likes?page=${page}&size=${size}`);
}

export function addLike(productId: string): Promise<void> {
  return apiClient.request(`/api/v1/products/${encodeURIComponent(productId)}/likes`, { method: 'POST' });
}

export function removeLike(productId: string): Promise<void> {
  return apiClient.request(`/api/v1/products/${encodeURIComponent(productId)}/likes`, { method: 'DELETE' });
}

export function hasLiked(products: readonly Product[], productId: string): boolean {
  return products.some((product) => product.id === productId);
}
