import { subDays, format } from 'date-fns';
import type { Provider } from '@/types';

// ==========================================
// Mock Data Engine for Dashboard UI
// ==========================================

export interface DailySpend {
  date: string;
  total: number;
  openai: number;
  anthropic: number;
  gemini: number;
  mistral: number;
  cohere: number;
  bedrock: number;
  azure_openai: number;
}

export interface ProviderBreakdown {
  provider: Provider;
  cost: number;
  percentage: number;
  tokens: number;
  activeKeys: number;
}

export interface DashboardStats {
  totalSpend: number;
  spendTrend: number; // percentage change vs prev period
  projectedSpend: number;
  projectedTrend: number;
  activeKeys: number;
  keysTrend: number;
  blendedRate: number; // cost per 1k tokens
  rateTrend: number;
}

// Generate realistic looking daily spend data
export function generateDailySpend(days: number = 30): DailySpend[] {
  const data: DailySpend[] = [];
  const today = new Date();

  // Base daily spend rough amounts
  let baseSpend = 45.0;

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'MMM dd');

    // Add some random walk variance + weekend dips
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const variance = (Math.random() - 0.5) * 15;
    baseSpend = Math.max(10, baseSpend + variance);

    const dailyTotal = isWeekend ? baseSpend * 0.4 : baseSpend;

    // Distribute among providers (realistic split)
    const openai = dailyTotal * 0.45;    // 45%
    const anthropic = dailyTotal * 0.35; // 35%
    const gemini = dailyTotal * 0.10;    // 10%
    const mistral = dailyTotal * 0.05;   // 5%
    const others = dailyTotal * 0.05;    // 5% distributed

    data.push({
      date: dateStr,
      total: Number(dailyTotal.toFixed(2)),
      openai: Number(openai.toFixed(2)),
      anthropic: Number(anthropic.toFixed(2)),
      gemini: Number(gemini.toFixed(2)),
      mistral: Number(mistral.toFixed(2)),
      cohere: Number((others * 0.4).toFixed(2)),
      bedrock: Number((others * 0.4).toFixed(2)),
      azure_openai: Number((others * 0.2).toFixed(2)),
    });
  }

  return data;
}

// Generate provider breakdown aggregate
export function getProviderBreakdown(dailyData: DailySpend[]): ProviderBreakdown[] {
  const totals = dailyData.reduce(
    (acc, curr) => {
      acc.total += curr.total;
      acc.openai += curr.openai;
      acc.anthropic += curr.anthropic;
      acc.gemini += curr.gemini;
      acc.mistral += curr.mistral;
      acc.cohere += curr.cohere;
      acc.bedrock += curr.bedrock;
      acc.azure_openai += curr.azure_openai;
      return acc;
    },
    {
      total: 0,
      openai: 0,
      anthropic: 0,
      gemini: 0,
      mistral: 0,
      cohere: 0,
      bedrock: 0,
      azure_openai: 0,
    }
  );

  const formatPct = (val: number) => Number(((val / totals.total) * 100).toFixed(1));
  const estimateTokens = (cost: number, avgRate: number) => Math.floor((cost / avgRate) * 1000);

  const breakdown: ProviderBreakdown[] = [
    { provider: 'openai', cost: totals.openai, percentage: formatPct(totals.openai), tokens: estimateTokens(totals.openai, 0.015), activeKeys: 3 },
    { provider: 'anthropic', cost: totals.anthropic, percentage: formatPct(totals.anthropic), tokens: estimateTokens(totals.anthropic, 0.015), activeKeys: 2 },
    { provider: 'gemini', cost: totals.gemini, percentage: formatPct(totals.gemini), tokens: estimateTokens(totals.gemini, 0.005), activeKeys: 1 },
    { provider: 'mistral', cost: totals.mistral, percentage: formatPct(totals.mistral), tokens: estimateTokens(totals.mistral, 0.003), activeKeys: 1 },
    { provider: 'cohere', cost: totals.cohere, percentage: formatPct(totals.cohere), tokens: estimateTokens(totals.cohere, 0.01), activeKeys: 0 },
    { provider: 'bedrock', cost: totals.bedrock, percentage: formatPct(totals.bedrock), tokens: estimateTokens(totals.bedrock, 0.01), activeKeys: 1 },
    { provider: 'azure_openai', cost: totals.azure_openai, percentage: formatPct(totals.azure_openai), tokens: estimateTokens(totals.azure_openai, 0.015), activeKeys: 0 },
  ];

  return breakdown.sort((a, b) => b.cost - a.cost).filter(p => p.cost > 0);
}

// Get aggregate stats
export function getDashboardStats(dailyData: DailySpend[]): DashboardStats {
  const totalSpend = dailyData.reduce((acc, curr) => acc + curr.total, 0);

  // Simple projection: average daily * 30
  const avgDaily = totalSpend / dailyData.length;
  const projectedSpend = avgDaily * 30;

  return {
    totalSpend,
    spendTrend: 12.5, // +12.5%
    projectedSpend,
    projectedTrend: -2.4, // -2.4% (saving)
    activeKeys: 8,
    keysTrend: 0,
    blendedRate: 0.014, // $0.014 per 1k tokens
    rateTrend: -5.2, // costs getting cheaper
  };
}

// Prefab 30-day dataset to avoid hydration mismatches
export const mockDailyData = generateDailySpend(30);
export const mockBreakdown = getProviderBreakdown(mockDailyData);
export const mockStats = getDashboardStats(mockDailyData);
