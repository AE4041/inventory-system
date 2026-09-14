// Human-readable, collision-resistant receipt number: INV-YYYYMMDD-<store4>-<random5>
export function generateReceiptNumber(storeId) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const storeTag = storeId.slice(-4).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV-${date}-${storeTag}-${random}`;
}
