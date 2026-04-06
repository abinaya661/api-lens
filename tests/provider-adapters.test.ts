import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { OpenAIAdapter } from '../lib/platforms/adapters/openai';
import { AnthropicAdapter } from '../lib/platforms/adapters/anthropic';
import { GrokAdapter } from '../lib/platforms/adapters/grok';
import { GeminiAdapter } from '../lib/platforms/adapters/gemini';
import { OpenRouterAdapter } from '../lib/platforms/adapters/openrouter';
import { ElevenLabsAdapter } from '../lib/platforms/adapters/elevenlabs';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('provider adapter validation', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('OpenAI rejects keys without admin prefix', async () => {
    const result = await new OpenAIAdapter().validateKey('sk-test');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Admin API key');
  });

  test('OpenAI accepts admin keys with billing access', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const result = await new OpenAIAdapter().validateKey('sk-admin-test123');

    expect(result.valid).toBe(true);
    expect(result.keyType).toBe('admin');
  });

  test('Anthropic rejects non-admin keys', async () => {
    const result = await new AnthropicAdapter().validateKey('sk-ant-test');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Admin API key');
  });

  test('Anthropic accepts admin keys', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const result = await new AnthropicAdapter().validateKey('sk-ant-admin-test123');

    expect(result.valid).toBe(true);
    expect(result.keyType).toBe('admin');
  });

  test('Gemini accepts valid API keys for validation-only', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ models: [] }, 200));

    const result = await new GeminiAdapter().validateKey('AIzaSyTest123');

    expect(result.valid).toBe(true);
    expect(result.keyType).toBe('standard');
  });

  test('Gemini rejects invalid API keys', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid key' }, 400));

    const result = await new GeminiAdapter().validateKey('bad-key');

    expect(result.valid).toBe(false);
  });

  test('Grok accepts valid API keys for validation-only', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const result = await new GrokAdapter().validateKey('xai-test123');

    expect(result.valid).toBe(true);
    expect(result.keyType).toBe('standard');
  });

  test('Grok rejects invalid API keys', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, 401));

    const result = await new GrokAdapter().validateKey('bad-key');

    expect(result.valid).toBe(false);
  });

  test('OpenRouter validates via auth/key endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { usage: 12.5 } }, 200));

    const result = await new OpenRouterAdapter().validateKey('sk-or-test');

    expect(result.valid).toBe(true);
    expect(result.keyType).toBe('standard');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/auth/key',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-or-test' },
      }),
    );
  });
});

describe('provider adapter fetchUsage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('Gemini fetchUsage returns success with empty rows', async () => {
    const result = await new GeminiAdapter().fetchUsage('AIzaSyTest', '2026-04-01', '2026-04-06');
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(0);
    expect(result.error).toBeUndefined();
  });

  test('Grok fetchUsage returns success with empty rows', async () => {
    const result = await new GrokAdapter().fetchUsage('xai-test', '2026-04-01', '2026-04-06');
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(0);
    expect(result.error).toBeUndefined();
  });

  test('OpenRouter fetchUsage with activity endpoint returns per-model rows', async () => {
    const activityData = {
      data: [
        { id: '1', model: 'openai/gpt-4o', tokens_prompt: 100, tokens_completion: 50, total_cost: 0.003, created_at: '2026-04-05T10:00:00Z' },
        { id: '2', model: 'openai/gpt-4o', tokens_prompt: 200, tokens_completion: 100, total_cost: 0.006, created_at: '2026-04-05T11:00:00Z' },
        { id: '3', model: 'anthropic/claude-3.5-sonnet', tokens_prompt: 500, tokens_completion: 200, total_cost: 0.01, created_at: '2026-04-05T12:00:00Z' },
      ],
    };

    fetchMock.mockResolvedValueOnce(jsonResponse(activityData, 200));

    const result = await new OpenRouterAdapter().fetchUsage('sk-or-test', '2026-04-05', '2026-04-06');

    expect(result.success).toBe(true);
    expect(result.rows.length).toBe(2); // 2 distinct models
    const gpt4Row = result.rows.find(r => r.model === 'openai/gpt-4o');
    const claudeRow = result.rows.find(r => r.model === 'anthropic/claude-3.5-sonnet');
    expect(gpt4Row).toBeDefined();
    if (gpt4Row) {
      expect(gpt4Row.input_tokens).toBe(300);
      expect(gpt4Row.output_tokens).toBe(150);
      expect(gpt4Row.cost_usd).toBeCloseTo(0.009);
      expect(gpt4Row.request_count).toBe(2);
      expect(gpt4Row.cost_source).toBe('api');
    }
    expect(claudeRow).toBeDefined();
    if (claudeRow) {
      expect(claudeRow.input_tokens).toBe(500);
      expect(claudeRow.cost_usd).toBeCloseTo(0.01);
    }
  });

  test('OpenRouter fetchUsage falls back to aggregate on activity error', async () => {
    // Activity endpoint fails
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'not found' }, 404));
    // Aggregate endpoint succeeds
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { usage: 5.25 } }, 200));

    const result = await new OpenRouterAdapter().fetchUsage('sk-or-test', '2026-04-05', '2026-04-06');

    expect(result.success).toBe(true);
    expect(result.rows.length).toBe(1);
    const row = result.rows[0];
    if (row) {
      expect(row.model).toBe('all-models');
      expect(row.cost_usd).toBe(5.25);
      expect(row.cost_source).toBe('estimated');
    }
  });
});

describe('provider capabilities', () => {
  test('OpenAI declares full capabilities with admin key', () => {
    const caps = new OpenAIAdapter().getCapabilities();
    expect(caps.canValidateKey).toBe(true);
    expect(caps.canFetchUsage).toBe(true);
    expect(caps.canFetchCost).toBe(true);
    expect(caps.canListManagedKeys).toBe(true);
    expect(caps.canPerModelBreakdown).toBe(true);
    expect(caps.canPerKeyBreakdown).toBe(true);
    expect(caps.requiresAdminKey).toBe(true);
    expect(caps.adminKeyPrefix).toBe('sk-admin-');
  });

  test('Anthropic declares full capabilities with admin key', () => {
    const caps = new AnthropicAdapter().getCapabilities();
    expect(caps.canValidateKey).toBe(true);
    expect(caps.canFetchUsage).toBe(true);
    expect(caps.canListManagedKeys).toBe(true);
    expect(caps.requiresAdminKey).toBe(true);
    expect(caps.adminKeyPrefix).toBe('sk-ant-admin');
  });

  test('Gemini declares validation-only', () => {
    const caps = new GeminiAdapter().getCapabilities();
    expect(caps.canValidateKey).toBe(true);
    expect(caps.canFetchUsage).toBe(false);
    expect(caps.canFetchCost).toBe(false);
    expect(caps.canListManagedKeys).toBe(false);
    expect(caps.requiresAdminKey).toBe(false);
    expect(caps.usageNote).toBeDefined();
  });

  test('Grok declares validation-only', () => {
    const caps = new GrokAdapter().getCapabilities();
    expect(caps.canValidateKey).toBe(true);
    expect(caps.canFetchUsage).toBe(false);
    expect(caps.canFetchCost).toBe(false);
    expect(caps.requiresAdminKey).toBe(false);
  });

  test('OpenRouter declares per-model tracking without admin key', () => {
    const caps = new OpenRouterAdapter().getCapabilities();
    expect(caps.canValidateKey).toBe(true);
    expect(caps.canFetchUsage).toBe(true);
    expect(caps.canFetchCost).toBe(true);
    expect(caps.canPerModelBreakdown).toBe(true);
    expect(caps.canPerKeyBreakdown).toBe(false);
    expect(caps.canListManagedKeys).toBe(false);
    expect(caps.requiresAdminKey).toBe(false);
  });

  test('ElevenLabs declares aggregate usage', () => {
    const caps = new ElevenLabsAdapter().getCapabilities();
    expect(caps.canFetchUsage).toBe(true);
    expect(caps.canFetchCost).toBe(false);
    expect(caps.canPerModelBreakdown).toBe(false);
  });
});
