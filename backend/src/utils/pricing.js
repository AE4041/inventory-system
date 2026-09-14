// Resolves the effective cost/selling price for a product at a specific store:
// the store's own override (from its StoreProduct row) if set, otherwise the product's default.
export function effectivePrice(storeProduct, product) {
  return {
    costPrice: storeProduct?.costPrice ?? product.costPrice,
    sellingPrice: storeProduct?.sellingPrice ?? product.sellingPrice,
  };
}
