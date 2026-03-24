'use client';

import { useRegionalPrice } from '@/hooks/use-regional-price';
import { formatPrice } from '@/lib/regional-pricing';

export function RegionalPriceText() {
  const regional = useRegionalPrice();
  const monthly = formatPrice(regional, 'monthly');
  const annual = formatPrice(regional, 'annual');
  return <>{monthly}/mo or {annual}/yr (2 months free). Cancel anytime.</>;
}
