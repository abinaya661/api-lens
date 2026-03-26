'use client';

import { useState, useEffect } from 'react';
import { getRegionalPrice, type RegionalPrice } from '@/lib/regional-pricing';

const DEFAULT_PRICE = getRegionalPrice(null);

function getCountryCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)geo_country=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function useRegionalPrice(): RegionalPrice {
  const [price, setPrice] = useState<RegionalPrice>(DEFAULT_PRICE);

  useEffect(() => {
    const country = getCountryCookie();
    if (country) {
      setPrice(getRegionalPrice(country));
    }
  }, []);

  return price;
}
