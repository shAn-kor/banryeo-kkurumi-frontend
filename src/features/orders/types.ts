export type OrderItemRequest = Readonly<{
  productId: string;
  quantity: number;
}>;

export type OrderItemSnapshot = Readonly<{
  id: string;
  productId: string;
  quantity: number;
  snapshotProductName: string;
  snapshotPrice: number;
  snapshotBrandName: string;
}>;

export type PublicOrder = Readonly<{
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: OrderItemSnapshot[];
}>;

export type OrderList = Readonly<{
  items: PublicOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}>;

export type OrderListQuery = Readonly<{
  startAt: string;
  endAt: string;
  page: number;
  size: number;
}>;
