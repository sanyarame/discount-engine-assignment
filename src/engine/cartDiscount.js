export function applyCartDiscount(results, discount) {
  const subtotal = results.reduce((sum, item) => sum + item.finalPrice, 0);

  if (subtotal < discount.threshold) {
    return {
      subtotal,
      discountAmount: 0,
      total: subtotal,
    };
  }

  const discountAmount = Math.round(subtotal * discount.value / 100);

  return {
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
  };
}