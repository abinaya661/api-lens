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
  IN: { monthly: '399', annual: '3,999', currency: 'INR', symbol: '₹' },
  // North America
  US: { monthly: '5.99', annual: '59.99', currency: 'USD', symbol: '$' },
  CA: { monthly: '5.99', annual: '59.99', currency: 'CAD', symbol: 'CA$' },
  // Eurozone
  EU: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  DE: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  FR: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  IT: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  ES: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  NL: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  BE: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  AT: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  PT: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  IE: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  FI: { monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€' },
  // United Kingdom
  GB: { monthly: '5.99', annual: '59.99', currency: 'GBP', symbol: '£' },
};

const DEFAULT_PRICE: RegionalPrice = {
  monthly: '4.99',
  annual: '49.99',
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
