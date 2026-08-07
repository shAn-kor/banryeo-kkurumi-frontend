import type { OrderItemRequest } from './types';

const DRAFT_KEY = 'banryeo-kkurumi.checkout-draft.v1';

export type CheckoutDraftItem = Readonly<{
  productId: string;
  name: string;
  price: number;
  quantity: number;
}>;

function isDraftItem(value: unknown): value is CheckoutDraftItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.productId === 'string'
    && typeof item.name === 'string'
    && typeof item.price === 'number'
    && Number.isFinite(item.price)
    && typeof item.quantity === 'number'
    && Number.isInteger(item.quantity)
    && item.quantity > 0;
}

export function readCheckoutDraft(): CheckoutDraftItem[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isDraftItem) : [];
  } catch {
    return [];
  }
}

export function writeCheckoutDraft(items: CheckoutDraftItem[]): void {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(items));
}

export function clearCheckoutDraft(): void {
  window.sessionStorage.removeItem(DRAFT_KEY);
}

export function addCheckoutDraftItem(item: CheckoutDraftItem): CheckoutDraftItem[] {
  const items = readCheckoutDraft();
  const existing = items.find((draftItem) => draftItem.productId === item.productId);
  const nextItems = existing
    ? items.map((draftItem) => draftItem.productId === item.productId
      ? { ...draftItem, quantity: draftItem.quantity + item.quantity }
      : draftItem)
    : [...items, item];
  writeCheckoutDraft(nextItems);
  return nextItems;
}

export function toOrderItems(items: CheckoutDraftItem[]): OrderItemRequest[] {
  return items.map(({ productId, quantity }) => ({ productId, quantity }));
}
