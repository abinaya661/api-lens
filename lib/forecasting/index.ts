export interface DailyAmount {
  date: string;
  amount: number;
}

export interface ForecastSummary {
  forecast: number;
  confidenceLow: number;
  confidenceHigh: number;
  weightedDailyAvg: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

function sortDailySpend(dailySpend: DailyAmount[]) {
  return [...dailySpend].sort((a, b) => a.date.localeCompare(b.date));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function buildWeights(length: number, decayFactor: number) {
  return Array.from({ length }, (_, index) => decayFactor ** (length - 1 - index));
}

function weightedAverage(amounts: number[], weights: number[]) {
  if (amounts.length === 0) return 0;

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = amounts.reduce((sum, amount, index) => sum + amount * weights[index]!, 0);
  return weightedSum / totalWeight;
}

function detectTrend(amounts: number[]) {
  if (amounts.length < 2) return 'stable' as const;

  const midpoint = Math.floor(amounts.length / 2);
  const older = amounts.slice(0, midpoint || 1);
  const recent = amounts.slice(midpoint || 1);

  const olderAvg = older.length > 0 ? older.reduce((sum, amount) => sum + amount, 0) / older.length : 0;
  const recentAvg = recent.length > 0 ? recent.reduce((sum, amount) => sum + amount, 0) / recent.length : olderAvg;

  if (olderAvg === 0 && recentAvg === 0) return 'stable' as const;
  if (olderAvg === 0 && recentAvg > 0) return 'increasing' as const;
  if (olderAvg > 0 && recentAvg === 0) return 'decreasing' as const;

  const delta = (recentAvg - olderAvg) / olderAvg;
  if (delta > 0.05) return 'increasing' as const;
  if (delta < -0.05) return 'decreasing' as const;
  return 'stable' as const;
}

export function weightedMovingAverageForecast(
  dailySpend: DailyAmount[],
  daysInMonth: number,
  decayFactor: number = 0.85,
): ForecastSummary {
  const sorted = sortDailySpend(dailySpend);
  const amounts = sorted.map((entry) => entry.amount);
  const totalCurrentSpend = amounts.reduce((sum, amount) => sum + amount, 0);
  const observedDays = amounts.length;
  const remainingDays = Math.max(daysInMonth - observedDays, 0);

  if (observedDays === 0) {
    return {
      forecast: 0,
      confidenceLow: 0,
      confidenceHigh: 0,
      weightedDailyAvg: 0,
      trend: 'stable',
    };
  }

  const fallbackDailyAvg = totalCurrentSpend / observedDays;
  if (observedDays < 3) {
    const forecast = totalCurrentSpend + fallbackDailyAvg * remainingDays;
    return {
      forecast: roundCurrency(forecast),
      confidenceLow: roundCurrency(totalCurrentSpend),
      confidenceHigh: roundCurrency(forecast),
      weightedDailyAvg: roundCurrency(fallbackDailyAvg),
      trend: detectTrend(amounts),
    };
  }

  const weights = buildWeights(observedDays, decayFactor);
  const weightedDailyAvg = weightedAverage(amounts, weights);
  const forecast = totalCurrentSpend + weightedDailyAvg * remainingDays;

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const variance = amounts.reduce((sum, amount, index) => {
    const delta = amount - weightedDailyAvg;
    return sum + (weights[index] ?? 0) * delta * delta;
  }, 0) / totalWeight;
  const stdDev = Math.sqrt(Math.max(variance, 0));
  const confidenceSpread = remainingDays > 0 ? 1.96 * stdDev * Math.sqrt(remainingDays) : 0;

  return {
    forecast: roundCurrency(forecast),
    confidenceLow: roundCurrency(Math.max(totalCurrentSpend, forecast - confidenceSpread)),
    confidenceHigh: roundCurrency(forecast + confidenceSpread),
    weightedDailyAvg: roundCurrency(weightedDailyAvg),
    trend: detectTrend(amounts),
  };
}

function formatMonthDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function generateForecastSeries(
  dailySpend: DailyAmount[],
  daysInMonth: number,
  year: number,
  month: number,
  decayFactor: number = 0.85,
) {
  const sorted = sortDailySpend(dailySpend);
  const dailyMap = new Map(sorted.map((entry) => [entry.date, entry.amount]));
  const lastObservedDate = sorted.at(-1)?.date ?? null;
  const summary = weightedMovingAverageForecast(sorted, daysInMonth, decayFactor);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = formatMonthDate(year, month, index + 1);
    const actual = dailyMap.get(date) ?? 0;
    const isObserved = lastObservedDate ? date <= lastObservedDate : false;

    return {
      date,
      actual: isObserved ? actual : 0,
      forecast: isObserved ? null : roundCurrency(summary.weightedDailyAvg),
    };
  });
}
