import { apiClient } from '../../api/client';

export type PublicPayment = Readonly<{
  orderId: string;
  status: string;
  reason?: string;
  updatedAt: string;
}>;

export function getPayment(orderId: string): Promise<PublicPayment> {
  const query = new URLSearchParams({ orderId });
  return apiClient.request<PublicPayment>(`/api/v1/payments?${query.toString()}`);
}
