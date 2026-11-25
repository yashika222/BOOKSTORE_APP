export const INR_CURRENCY = 'INR';

export function formatCurrency(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rs. ${value}`;
}

export function shippingFeeFor(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0 || subtotal >= 500) return 0;
  return 49;
}

export function discountPercent(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
