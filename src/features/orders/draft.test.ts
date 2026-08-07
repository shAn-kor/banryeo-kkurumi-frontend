import { beforeEach, describe, expect, it } from 'vitest';
import { addCheckoutDraftItem, clearCheckoutDraft, readCheckoutDraft, toOrderItems, writeCheckoutDraft } from './draft';

describe('checkout draft', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('addCheckoutDraftItem_sameProduct_combinesQuantityInSessionOnly', () => {
    addCheckoutDraftItem({ productId: 'product-a', name: '간식', price: 12000, quantity: 1 });
    const result = addCheckoutDraftItem({ productId: 'product-a', name: '간식', price: 12000, quantity: 2 });

    expect(result).toEqual([{ productId: 'product-a', name: '간식', price: 12000, quantity: 3 }]);
    expect(readCheckoutDraft()).toEqual(result);
  });

  it('toOrderItems_draftItems_returnsOnlyItemsContract', () => {
    const result = toOrderItems([{ productId: 'product-a', name: '간식', price: 12000, quantity: 2 }]);

    expect(result).toEqual([{ productId: 'product-a', quantity: 2 }]);
  });

  it('readCheckoutDraft_malformedSessionValue_returnsEmptyDraft', () => {
    window.sessionStorage.setItem('banryeo-kkurumi.checkout-draft.v1', '{not-json');

    expect(readCheckoutDraft()).toEqual([]);
  });

  it('clearCheckoutDraft_afterWrite_removesTemporaryItems', () => {
    writeCheckoutDraft([{ productId: 'product-a', name: '간식', price: 12000, quantity: 2 }]);
    clearCheckoutDraft();

    expect(readCheckoutDraft()).toEqual([]);
  });
});
