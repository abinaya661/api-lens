INSERT INTO model_pricing (provider, model_id, input_price_per_1k, output_price_per_1k, effective_date)
VALUES
  -- OpenAI
  ('openai', 'gpt-4o', 0.0025, 0.01, '2024-05-01'),
  ('openai', 'gpt-4o-mini', 0.00015, 0.0006, '2024-07-01'),
  ('openai', 'gpt-4-turbo', 0.01, 0.03, '2024-04-01'),
  ('openai', 'gpt-3.5-turbo', 0.0005, 0.0015, '2024-01-01'),
  ('openai', 'o1', 0.015, 0.06, '2024-12-01'),
  ('openai', 'o1-mini', 0.003, 0.012, '2024-09-01'),
  -- Anthropic
  ('anthropic', 'claude-opus-4-6', 0.015, 0.075, '2025-06-01'),
  ('anthropic', 'claude-sonnet-4-6', 0.003, 0.015, '2025-06-01'),
  ('anthropic', 'claude-haiku-4-5', 0.0008, 0.004, '2025-06-01'),
  ('anthropic', 'claude-3-5-sonnet-20241022', 0.003, 0.015, '2024-10-01'),
  ('anthropic', 'claude-3-5-haiku-20241022', 0.0008, 0.004, '2024-10-01'),
  -- Mistral
  ('mistral', 'mistral-large-latest', 0.002, 0.006, '2024-01-01'),
  ('mistral', 'mistral-medium', 0.0027, 0.0081, '2024-01-01'),
  ('mistral', 'mistral-small', 0.0002, 0.0006, '2024-01-01'),
  ('mistral', 'codestral-latest', 0.001, 0.003, '2024-05-01'),
  -- Cohere
  ('cohere', 'command-r-plus', 0.003, 0.015, '2024-04-01'),
  ('cohere', 'command-r', 0.0005, 0.0015, '2024-03-01'),
  ('cohere', 'command', 0.001, 0.002, '2024-01-01'),
  -- Google Gemini
  ('gemini', 'gemini-1.5-pro', 0.00125, 0.005, '2024-05-01'),
  ('gemini', 'gemini-1.5-flash', 0.000075, 0.0003, '2024-05-01'),
  ('gemini', 'gemini-2.0-flash', 0.0001, 0.0004, '2025-01-01'),
  -- OpenRouter (pass-through pricing varies, use average)
  ('openrouter', 'openrouter/auto', 0.001, 0.002, '2024-01-01')
ON CONFLICT DO NOTHING;
