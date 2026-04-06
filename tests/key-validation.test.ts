import { describe, test, expect } from 'vitest';
import { addKeySchema, updateKeySchema } from '../lib/validations/key';

describe('addKeySchema', () => {
  test('accepts valid openai input with admin key prefix', () => {
    const result = addKeySchema.safeParse({
      provider: 'openai',
      nickname: 'My Key',
      api_key: 'sk-admin-1234567890',
    });
    expect(result.success).toBe(true);
  });

  test('rejects openai key without admin prefix', () => {
    const result = addKeySchema.safeParse({
      provider: 'openai',
      nickname: 'My Key',
      api_key: 'sk-proj-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid anthropic input with admin key prefix', () => {
    const result = addKeySchema.safeParse({
      provider: 'anthropic',
      nickname: 'My Key',
      api_key: 'sk-ant-admin-1234567890',
    });
    expect(result.success).toBe(true);
  });

  test('rejects anthropic key without admin prefix', () => {
    const result = addKeySchema.safeParse({
      provider: 'anthropic',
      nickname: 'My Key',
      api_key: 'sk-ant-api-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid gemini key (no prefix requirement)', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Gemini Key',
      api_key: 'AIzaSyC1234567890',
    });
    expect(result.success).toBe(true);
  });

  test('accepts valid grok key (no prefix requirement)', () => {
    const result = addKeySchema.safeParse({
      provider: 'grok',
      nickname: 'My Grok Key',
      api_key: 'xai-1234567890',
    });
    expect(result.success).toBe(true);
  });

  test('accepts valid openrouter key with sk-or- prefix', () => {
    const result = addKeySchema.safeParse({
      provider: 'openrouter',
      nickname: 'My OR Key',
      api_key: 'sk-or-v1-1234567890',
    });
    expect(result.success).toBe(true);
  });

  test('rejects openrouter key without sk-or- prefix', () => {
    const result = addKeySchema.safeParse({
      provider: 'openrouter',
      nickname: 'My OR Key',
      api_key: 'sk-bad-prefix-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('accepts short openrouter key (prefix check only triggers after 5 chars)', () => {
    const result = addKeySchema.safeParse({
      provider: 'openrouter',
      nickname: 'My OR Key',
      api_key: 'sk-o',
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty provider', () => {
    const result = addKeySchema.safeParse({
      provider: '',
      nickname: 'My Key',
      api_key: 'sk-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('rejects unsupported provider', () => {
    const result = addKeySchema.safeParse({
      provider: 'not-a-provider',
      nickname: 'My Key',
      api_key: 'sk-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty nickname', () => {
    const result = addKeySchema.safeParse({
      provider: 'openai',
      nickname: '',
      api_key: 'sk-admin-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('rejects nickname over 100 chars', () => {
    const result = addKeySchema.safeParse({
      provider: 'openai',
      nickname: 'a'.repeat(101),
      api_key: 'sk-admin-1234567890',
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty api_key', () => {
    const result = addKeySchema.safeParse({
      provider: 'openai',
      nickname: 'My Key',
      api_key: '',
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid HTTPS endpoint_url', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: 'https://api.example.com/v1',
    });
    expect(result.success).toBe(true);
  });

  test('rejects HTTP endpoint_url', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: 'http://api.example.com/v1',
    });
    expect(result.success).toBe(false);
  });

  test('rejects localhost endpoint_url', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: 'https://localhost:3000',
    });
    expect(result.success).toBe(false);
  });

  test('rejects private IP endpoint_url (192.168.x.x)', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: 'https://192.168.1.1/api',
    });
    expect(result.success).toBe(false);
  });

  test('rejects private IP endpoint_url (10.x.x.x)', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: 'https://10.0.0.1/api',
    });
    expect(result.success).toBe(false);
  });

  test('rejects .internal domain endpoint_url', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: 'https://service.internal',
    });
    expect(result.success).toBe(false);
  });

  test('accepts empty string endpoint_url', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      endpoint_url: '',
    });
    expect(result.success).toBe(true);
  });

  test('accepts valid UUID project_id', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      project_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid project_id format', () => {
    const result = addKeySchema.safeParse({
      provider: 'gemini',
      nickname: 'My Key',
      api_key: 'AIzaSy123',
      project_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateKeySchema', () => {
  test('accepts valid id with partial updates', () => {
    const result = updateKeySchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      nickname: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  test('rejects missing id', () => {
    const result = updateKeySchema.safeParse({
      nickname: 'Updated Name',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid id format', () => {
    const result = updateKeySchema.safeParse({
      id: 'not-a-uuid',
      nickname: 'Updated Name',
    });
    expect(result.success).toBe(false);
  });
});
