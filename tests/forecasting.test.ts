import { describe, expect, test } from 'vitest';
import { generateForecastSeries, weightedMovingAverageForecast } from '../lib/forecasting';

describe('weightedMovingAverageForecast', () => {
  test('keeps constant daily spend flat across the remaining month', () => {
    const summary = weightedMovingAverageForecast(
      [
        { date: '2026-04-01', amount: 10 },
        { date: '2026-04-02', amount: 10 },
        { date: '2026-04-03', amount: 10 },
      ],
      30,
    );

    expect(summary.weightedDailyAvg).toBe(10);
    expect(summary.forecast).toBe(300);
    expect(summary.trend).toBe('stable');
  });

  test('projects increasing spend above a simple linear average', () => {
    const summary = weightedMovingAverageForecast(
      [
        { date: '2026-04-01', amount: 10 },
        { date: '2026-04-02', amount: 20 },
        { date: '2026-04-03', amount: 30 },
        { date: '2026-04-04', amount: 40 },
        { date: '2026-04-05', amount: 50 },
      ],
      30,
    );

    const linearForecast = 150 + (150 / 5) * 25;
    expect(summary.forecast).toBeGreaterThan(linearForecast);
    expect(summary.trend).toBe('increasing');
  });

  test('projects decreasing spend below a simple linear average', () => {
    const summary = weightedMovingAverageForecast(
      [
        { date: '2026-04-01', amount: 50 },
        { date: '2026-04-02', amount: 40 },
        { date: '2026-04-03', amount: 30 },
        { date: '2026-04-04', amount: 20 },
        { date: '2026-04-05', amount: 10 },
      ],
      30,
    );

    const linearForecast = 150 + (150 / 5) * 25;
    expect(summary.forecast).toBeLessThan(linearForecast);
    expect(summary.trend).toBe('decreasing');
  });

  test('falls back to linear forecasting with one observed day', () => {
    const summary = weightedMovingAverageForecast(
      [{ date: '2026-04-01', amount: 12 }],
      30,
    );

    expect(summary.weightedDailyAvg).toBe(12);
    expect(summary.forecast).toBe(360);
    expect(summary.confidenceLow).toBe(12);
    expect(summary.confidenceHigh).toBe(360);
  });

  test('returns zeros with no observed days', () => {
    const summary = weightedMovingAverageForecast([], 30);

    expect(summary).toEqual({
      forecast: 0,
      confidenceLow: 0,
      confidenceHigh: 0,
      weightedDailyAvg: 0,
      trend: 'stable',
    });
  });

  test('returns current spend only once the month is complete', () => {
    const dailySpend = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-04-${String(index + 1).padStart(2, '0')}`,
      amount: 5,
    }));

    const summary = weightedMovingAverageForecast(dailySpend, 30);

    expect(summary.forecast).toBe(150);
    expect(summary.confidenceLow).toBe(150);
    expect(summary.confidenceHigh).toBe(150);
  });
});

describe('generateForecastSeries', () => {
  test('fills month gaps with zero actuals and future days with forecasted values', () => {
    const series = generateForecastSeries(
      [
        { date: '2026-04-01', amount: 10 },
        { date: '2026-04-03', amount: 30 },
      ],
      5,
      2026,
      3,
    );

    expect(series).toEqual([
      { date: '2026-04-01', actual: 10, forecast: null },
      { date: '2026-04-02', actual: 0, forecast: null },
      { date: '2026-04-03', actual: 30, forecast: null },
      { date: '2026-04-04', actual: 0, forecast: 20 },
      { date: '2026-04-05', actual: 0, forecast: 20 },
    ]);
  });
});
