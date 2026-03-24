/**
 * Region-aware pricing configuration.
 *
 * Dodo Payments (as Merchant of Record) handles exact currency conversion at
 * checkout. These are approximate display prices so users see a familiar
 * currency symbol while browsing.
 */

export interface RegionalPrice {
  monthly: string;
  annual: string;
  currency: string;
  symbol: string;
}

const REGIONAL_PRICES: Record<string, RegionalPrice> = {
  // India
  IN: { monthly: '499', annual: '4,999', currency: 'INR', symbol: '₹' },
  // Eurozone
  EU: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  DE: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  FR: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  IT: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  ES: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  NL: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  BE: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  AT: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  PT: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  IE: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  FI: { monthly: '5.49', annual: '54.99', currency: 'EUR', symbol: '€' },
  // United Kingdom
  GB: { monthly: '4.79', annual: '47.99', currency: 'GBP', symbol: '£' },
  // Japan
  JP: { monthly: '890', annual: '8,900', currency: 'JPY', symbol: '¥' },
  // Brazil
  BR: { monthly: '29.90', annual: '299', currency: 'BRL', symbol: 'R$' },
  // Canada
  CA: { monthly: '7.99', annual: '79.99', currency: 'CAD', symbol: 'CA$' },
  // Australia
  AU: { monthly: '8.99', annual: '89.99', currency: 'AUD', symbol: 'A$' },
};

const DEFAULT_PRICE: RegionalPrice = {
  monthly: '5.99',
  annual: '59.99',
  currency: 'USD',
  symbol: '$',
};

export function getRegionalPrice(countryCode: string | null | undefined): RegionalPrice {
  if (!countryCode) return DEFAULT_PRICE;
  return REGIONAL_PRICES[countryCode.toUpperCase()] ?? DEFAULT_PRICE;
}

export function formatPrice(price: RegionalPrice, plan: 'monthly' | 'annual'): string {
  const amount = plan === 'monthly' ? price.monthly : price.annual;
  return `${price.symbol}${amount}`;
}
