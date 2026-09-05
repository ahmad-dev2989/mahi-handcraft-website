/**
 * Formats currency code or symbol into a display symbol.
 */
export const getCurrencySymbol = (currency: string = 'USD'): string => {
  if (!currency) return '$';
  const trimmed = currency.trim();
  const uppercase = trimmed.toUpperCase();

  switch (uppercase) {
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'NZD':
    case 'SGD':
    case 'HKD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'INR':
      return '₹';
    case 'PKR':
      return 'Rs ';
    case 'AED':
      return 'AED ';
    case 'SAR':
      return 'SAR ';
    default:
      // If code is already a symbol or short string
      return trimmed.length <= 4 && !/^[A-Z]{3}$/.test(trimmed) ? trimmed : `${trimmed} `;
  }
};

/**
 * Formats numeric monetary amounts with currency symbol and 2 decimal places.
 */
export const formatPrice = (amount: number | null | undefined, currency: string = 'USD'): string => {
  const numericAmount = Number(amount || 0);
  const symbol = getCurrencySymbol(currency);
  const formatted = numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};
