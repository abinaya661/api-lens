import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { OpenAIAdapter } from '../lib/platforms/adapters/openai';
import { AnthropicAdapter } from '../lib/platforms/adapters/anthropic';
import { DeepSeekAdapter } from '../lib/platforms/adapters/deepseek';
import { GrokAdapter } from '../lib/platforms/adapters/grok';
import { OpenRouterAdapter } from '../lib/platforms/adapters/openrouter';

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

  test('OpenAI rejects keys without usage/cost access', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [] }, 200))
      .mockResolvedValueOnce(jsonResponse({ error: 'forbidden' }, 403));

    const result = await new OpenAIAdapter().validateKey('sk-test');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot access OpenAI');
  });

  test('OpenAI accepts keys with inference and billing access', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [] }, 200))
      .mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const result = await new OpenAIAdapter().validateKey('sk-test');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('Anthropic rejects non-admin keys for usage tracking', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'msg_123' }, 200))
      .mockResolvedValueOnce(jsonResponse({ error: 'forbidden' }, 403));

    const result = await new AnthropicAdapter().validateKey('sk-ant-test');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Admin API key');
  });

  test('DeepSeek rejects keys without billing balance access', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, 500))
      .mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const result = await new DeepSeekAdapter().validateKey('sk-deepseek');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('balance API');
  });

  test('Grok rejects standard inference keys for tracking', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const result = await new GrokAdapter().validateKey('xai-test');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Management API key');
  });

  test('OpenRouter validates against the key endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { usage: 12.5 } }, 200));

    const result = await new OpenRouterAdapter().validateKey('sk-or-test');

    expect(result.valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/key',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-or-test' },
      }),
    );
  });
});
