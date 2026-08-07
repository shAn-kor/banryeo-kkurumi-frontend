import { apiClient } from '../../api/client';
import type { OrderItemRequest, OrderList, OrderListQuery, PublicOrder } from './types';

function queryString(query: OrderListQuery): string {
  const params = new URLSearchParams({
    startAt: query.startAt,
    endAt: query.endAt,
    page: String(query.page),
    size: String(query.size),
  });
  return params.toString();
}

export function createOrder(items: OrderItemRequest[]): Promise<PublicOrder> {
  return apiClient.request<PublicOrder>('/api/v1/orders', {
    method: 'POST',
    body: { items },
  });
}

export function getOrder(orderId: string): Promise<PublicOrder> {
  return apiClient.request<PublicOrder>(`/api/v1/orders/${encodeURIComponent(orderId)}`);
}

export function listOrders(query: OrderListQuery): Promise<OrderList> {
  return apiClient.request<OrderList>(`/api/v1/orders?${queryString(query)}`);
}
