'use client';

import { useMemo } from 'react';
import { getRegionalPrice, type RegionalPrice } from '@/lib/regional-pricing';

function getCountryCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)geo_country=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function useRegionalPrice(): RegionalPrice {
  return useMemo(() => getRegionalPrice(getCountryCookie()), []);
}
