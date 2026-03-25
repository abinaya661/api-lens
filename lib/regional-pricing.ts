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
  enterprise_monthly?: string;
  enterprise_annual?: string;
}

const REGIONAL_PRICES: Record<string, RegionalPrice> = {
  // India
  IN: {
    monthly: '399', annual: '3,999', currency: 'INR', symbol: '₹',
    enterprise_monthly: '799', enterprise_annual: '7,999',
  },
  // North America
  US: {
    monthly: '5.99', annual: '59.99', currency: 'USD', symbol: '$',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  CA: {
    monthly: '5.99', annual: '59.99', currency: 'CAD', symbol: 'CA$',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  // Eurozone
  EU: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  DE: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  FR: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  IT: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  ES: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  NL: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  BE: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  AT: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  PT: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  IE: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  FI: {
    monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
  // United Kingdom
  GB: {
    monthly: '5.99', annual: '59.99', currency: 'GBP', symbol: '£',
    enterprise_monthly: '9.99', enterprise_annual: '99.99',
  },
};

const DEFAULT_PRICE: RegionalPrice = {
  monthly: '4.99',
  annual: '49.99',
  currency: 'USD',
  symbol: '$',
  enterprise_monthly: '9.99',
  enterprise_annual: '99.99',
};

export function getRegionalPrice(countryCode: string | null | undefined): RegionalPrice {
  if (!countryCode) return DEFAULT_PRICE;
  return REGIONAL_PRICES[countryCode.toUpperCase()] ?? DEFAULT_PRICE;
}

export function formatPrice(price: RegionalPrice, plan: 'monthly' | 'annual'): string {
  const amount = plan === 'monthly' ? price.monthly : price.annual;
  return `${price.symbol}${amount}`;
}

export function formatEnterprisePrice(price: RegionalPrice): { monthly: string; annual: string } {
  const monthly = price.enterprise_monthly ?? '9.99';
  const annual = price.enterprise_annual ?? '99.99';
  return {
    monthly: `${price.symbol}${monthly}`,
    annual: `${price.symbol}${annual}`,
  };
}
