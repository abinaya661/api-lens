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

const EUR: RegionalPrice = {
  monthly: '5.99', annual: '59.99', currency: 'EUR', symbol: '€',
  enterprise_monthly: '9.99', enterprise_annual: '99.99',
};

const REGIONAL_PRICES: Record<string, RegionalPrice> = {
  // ── India ────────────────────────────────────────────────────────────────
  IN: { monthly: '399', annual: '3,999', currency: 'INR', symbol: '₹', enterprise_monthly: '799', enterprise_annual: '7,999' },

  // ── North America ────────────────────────────────────────────────────────
  US: { monthly: '5.99', annual: '59.99', currency: 'USD', symbol: '$', enterprise_monthly: '9.99', enterprise_annual: '99.99' },
  CA: { monthly: '5.99', annual: '59.99', currency: 'CAD', symbol: 'CA$', enterprise_monthly: '9.99', enterprise_annual: '99.99' },

  // ── Europe (Eurozone) ────────────────────────────────────────────────────
  EU: { ...EUR }, DE: { ...EUR }, FR: { ...EUR }, IT: { ...EUR },
  ES: { ...EUR }, NL: { ...EUR }, BE: { ...EUR }, AT: { ...EUR },
  PT: { ...EUR }, IE: { ...EUR }, FI: { ...EUR }, GR: { ...EUR },
  LU: { ...EUR }, LT: { ...EUR }, LV: { ...EUR }, EE: { ...EUR },
  SK: { ...EUR }, SI: { ...EUR }, CY: { ...EUR }, MT: { ...EUR },

  // ── Europe (non-Euro) ────────────────────────────────────────────────────
  GB: { monthly: '5.99', annual: '59.99', currency: 'GBP', symbol: '£', enterprise_monthly: '9.99', enterprise_annual: '99.99' },
  SE: { monthly: '54', annual: '539', currency: 'SEK', symbol: 'kr', enterprise_monthly: '109', enterprise_annual: '1,079' },
  NO: { monthly: '55', annual: '549', currency: 'NOK', symbol: 'kr', enterprise_monthly: '110', enterprise_annual: '1,099' },
  DK: { monthly: '35', annual: '349', currency: 'DKK', symbol: 'kr', enterprise_monthly: '70', enterprise_annual: '699' },
  CH: { monthly: '4.49', annual: '44.99', currency: 'CHF', symbol: 'CHF', enterprise_monthly: '8.99', enterprise_annual: '89.99' },
  PL: { monthly: '20', annual: '199', currency: 'PLN', symbol: 'zł', enterprise_monthly: '40', enterprise_annual: '399' },
  CZ: { monthly: '119', annual: '1,190', currency: 'CZK', symbol: 'Kč', enterprise_monthly: '239', enterprise_annual: '2,390' },
  HU: { monthly: '1,950', annual: '19,500', currency: 'HUF', symbol: 'Ft', enterprise_monthly: '3,900', enterprise_annual: '38,900' },
  RO: { monthly: '23', annual: '229', currency: 'RON', symbol: 'lei', enterprise_monthly: '46', enterprise_annual: '459' },
  HR: { monthly: '35', annual: '349', currency: 'EUR', symbol: '€', enterprise_monthly: '70', enterprise_annual: '699' },
  TR: { monthly: '179', annual: '1,799', currency: 'TRY', symbol: '₺', enterprise_monthly: '359', enterprise_annual: '3,599' },

  // ── Asia-Pacific ─────────────────────────────────────────────────────────
  JP: { monthly: '749', annual: '7,499', currency: 'JPY', symbol: '¥', enterprise_monthly: '1,499', enterprise_annual: '14,990' },
  KR: { monthly: '6,900', annual: '69,000', currency: 'KRW', symbol: '₩', enterprise_monthly: '13,900', enterprise_annual: '138,000' },
  CN: { monthly: '36', annual: '360', currency: 'CNY', symbol: '¥', enterprise_monthly: '72', enterprise_annual: '720' },
  HK: { monthly: '39', annual: '389', currency: 'HKD', symbol: 'HK$', enterprise_monthly: '78', enterprise_annual: '779' },
  TW: { monthly: '165', annual: '1,650', currency: 'TWD', symbol: 'NT$', enterprise_monthly: '330', enterprise_annual: '3,290' },
  SG: { monthly: '6.99', annual: '69.99', currency: 'SGD', symbol: 'S$', enterprise_monthly: '13.99', enterprise_annual: '139.99' },
  MY: { monthly: '23', annual: '229', currency: 'MYR', symbol: 'RM', enterprise_monthly: '46', enterprise_annual: '459' },
  TH: { monthly: '175', annual: '1,750', currency: 'THB', symbol: '฿', enterprise_monthly: '350', enterprise_annual: '3,490' },
  ID: { monthly: '79,000', annual: '790,000', currency: 'IDR', symbol: 'Rp', enterprise_monthly: '158,000', enterprise_annual: '1,580,000' },
  PH: { monthly: '290', annual: '2,899', currency: 'PHP', symbol: '₱', enterprise_monthly: '580', enterprise_annual: '5,799' },
  VN: { monthly: '125,000', annual: '1,250,000', currency: 'VND', symbol: '₫', enterprise_monthly: '249,000', enterprise_annual: '2,490,000' },
  AU: { monthly: '7.99', annual: '79.99', currency: 'AUD', symbol: 'A$', enterprise_monthly: '15.99', enterprise_annual: '159.99' },
  NZ: { monthly: '8.99', annual: '89.99', currency: 'NZD', symbol: 'NZ$', enterprise_monthly: '17.99', enterprise_annual: '179.99' },

  // ── Middle East ──────────────────────────────────────────────────────────
  AE: { monthly: '19', annual: '184', currency: 'AED', symbol: 'AED', enterprise_monthly: '38', enterprise_annual: '368' },
  SA: { monthly: '19', annual: '189', currency: 'SAR', symbol: 'SAR', enterprise_monthly: '38', enterprise_annual: '378' },
  IL: { monthly: '19', annual: '189', currency: 'ILS', symbol: '₪', enterprise_monthly: '38', enterprise_annual: '378' },
  QA: { monthly: '18', annual: '182', currency: 'QAR', symbol: 'QAR', enterprise_monthly: '36', enterprise_annual: '364' },
  KW: { monthly: '1.55', annual: '15.49', currency: 'KWD', symbol: 'KD', enterprise_monthly: '3.09', enterprise_annual: '30.99' },

  // ── Latin America ────────────────────────────────────────────────────────
  BR: { monthly: '29', annual: '289', currency: 'BRL', symbol: 'R$', enterprise_monthly: '58', enterprise_annual: '579' },
  MX: { monthly: '99', annual: '999', currency: 'MXN', symbol: 'MX$', enterprise_monthly: '199', enterprise_annual: '1,990' },
  CL: { monthly: '4,900', annual: '48,900', currency: 'CLP', symbol: 'CLP$', enterprise_monthly: '9,800', enterprise_annual: '97,800' },
  CO: { monthly: '20,900', annual: '209,000', currency: 'COP', symbol: 'COL$', enterprise_monthly: '41,800', enterprise_annual: '417,000' },
  AR: { monthly: '4,500', annual: '44,900', currency: 'ARS', symbol: 'ARS$', enterprise_monthly: '8,999', enterprise_annual: '89,900' },

  // ── Africa ───────────────────────────────────────────────────────────────
  ZA: { monthly: '92', annual: '924', currency: 'ZAR', symbol: 'R', enterprise_monthly: '184', enterprise_annual: '1,849' },
  NG: { monthly: '8,400', annual: '83,999', currency: 'NGN', symbol: '₦', enterprise_monthly: '16,800', enterprise_annual: '167,999' },
  KE: { monthly: '649', annual: '6,499', currency: 'KES', symbol: 'KSh', enterprise_monthly: '1,299', enterprise_annual: '12,999' },
  EG: { monthly: '249', annual: '2,499', currency: 'EGP', symbol: 'E£', enterprise_monthly: '499', enterprise_annual: '4,999' },
  GH: { monthly: '75', annual: '749', currency: 'GHS', symbol: 'GH₵', enterprise_monthly: '149', enterprise_annual: '1,499' },

  // ── South Asia ───────────────────────────────────────────────────────────
  PK: { monthly: '1,399', annual: '13,999', currency: 'PKR', symbol: '₨', enterprise_monthly: '2,799', enterprise_annual: '27,999' },
  BD: { monthly: '549', annual: '5,499', currency: 'BDT', symbol: '৳', enterprise_monthly: '1,099', enterprise_annual: '10,999' },
  LK: { monthly: '1,499', annual: '14,999', currency: 'LKR', symbol: 'Rs', enterprise_monthly: '2,999', enterprise_annual: '29,999' },
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
