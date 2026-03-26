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
  pro_monthly?: string;
  pro_annual?: string;
}

const EUR: RegionalPrice = {
  monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
  pro_monthly: '9.99', pro_annual: '99.99',
};

const REGIONAL_PRICES: Record<string, RegionalPrice> = {
  // India — fixed INR pricing
  IN: { monthly: '399', annual: '3,099', currency: 'INR', symbol: '₹', pro_monthly: '799', pro_annual: '7,999' },

  // North America
  US: { monthly: '5.99', annual: '59.99', currency: 'USD', symbol: '$', pro_monthly: '9.99', pro_annual: '99.99' },
  CA: { monthly: '5.99', annual: '59.99', currency: 'CAD', symbol: 'CA$', pro_monthly: '9.99', pro_annual: '99.99' },

  // Europe — Eurozone (all use EUR)
  EU: { ...EUR }, DE: { ...EUR }, FR: { ...EUR }, IT: { ...EUR },
  ES: { ...EUR }, NL: { ...EUR }, BE: { ...EUR }, AT: { ...EUR },
  PT: { ...EUR }, IE: { ...EUR }, FI: { ...EUR }, GR: { ...EUR },
  LU: { ...EUR }, LT: { ...EUR }, LV: { ...EUR }, EE: { ...EUR },
  SK: { ...EUR }, SI: { ...EUR }, CY: { ...EUR }, MT: { ...EUR },

  // United Kingdom — GBP
  GB: { monthly: '5.99', annual: '59.99', currency: 'GBP', symbol: '£', pro_monthly: '9.99', pro_annual: '99.99' },

  // All other countries → DEFAULT_PRICE ($4.99 USD).
  // Dodo Payments (as MoR) converts $4.99 to the customer's local currency at checkout.
};

const DEFAULT_PRICE: RegionalPrice = {
  monthly: '4.99',
  annual: '49.99',
  currency: 'USD',
  symbol: '$',
  pro_monthly: '9.99',
  pro_annual: '99.99',
};

export function getRegionalPrice(countryCode: string | null | undefined): RegionalPrice {
  if (!countryCode) return DEFAULT_PRICE;
  return REGIONAL_PRICES[countryCode.toUpperCase()] ?? DEFAULT_PRICE;
}

export function formatPrice(price: RegionalPrice, plan: 'monthly' | 'annual'): string {
  const amount = plan === 'monthly' ? price.monthly : price.annual;
  return `${price.symbol}${amount}`;
}

export function formatProPrice(price: RegionalPrice): { monthly: string; annual: string } {
  const monthly = price.pro_monthly ?? '9.99';
  const annual = price.pro_annual ?? '99.99';
  return {
    monthly: `${price.symbol}${monthly}`,
    annual: `${price.symbol}${annual}`,
  };
}
