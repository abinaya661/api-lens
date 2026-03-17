-- ============================================
-- Model Pricing Seed Data (March 2026 prices)
-- Covers OpenAI, Anthropic, Gemini, Mistral, Cohere
-- ============================================

-- OpenAI Models
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('openai', 'gpt-4o', 'GPT-4o', 0.0025, 0.01, '2026-01-01', true),
('openai', 'gpt-4o-mini', 'GPT-4o Mini', 0.00015, 0.0006, '2026-01-01', true),
('openai', 'gpt-4-turbo', 'GPT-4 Turbo', 0.01, 0.03, '2026-01-01', true),
('openai', 'gpt-4', 'GPT-4', 0.03, 0.06, '2026-01-01', true),
('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.0005, 0.0015, '2026-01-01', true),
('openai', 'o1', 'o1', 0.015, 0.06, '2026-01-01', true),
('openai', 'o1-mini', 'o1 Mini', 0.003, 0.012, '2026-01-01', true),
('openai', 'o3-mini', 'o3 Mini', 0.0011, 0.0044, '2026-01-01', true);

-- Anthropic Models
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('anthropic', 'claude-3-5-sonnet', 'Claude 3.5 Sonnet', 0.003, 0.015, '2026-01-01', true),
('anthropic', 'claude-3-5-haiku', 'Claude 3.5 Haiku', 0.0008, 0.004, '2026-01-01', true),
('anthropic', 'claude-3-opus', 'Claude 3 Opus', 0.015, 0.075, '2026-01-01', true),
('anthropic', 'claude-3-sonnet', 'Claude 3 Sonnet', 0.003, 0.015, '2026-01-01', true),
('anthropic', 'claude-3-haiku', 'Claude 3 Haiku', 0.00025, 0.00125, '2026-01-01', true);

-- Google Gemini Models
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 0.0001, 0.0004, '2026-01-01', true),
('gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', 0.00125, 0.005, '2026-01-01', true),
('gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 0.000075, 0.0003, '2026-01-01', true);

-- Mistral Models
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('mistral', 'mistral-large', 'Mistral Large', 0.002, 0.006, '2026-01-01', true),
('mistral', 'mistral-medium', 'Mistral Medium', 0.0027, 0.0081, '2026-01-01', true),
('mistral', 'mistral-small', 'Mistral Small', 0.001, 0.003, '2026-01-01', true),
('mistral', 'codestral', 'Codestral', 0.001, 0.003, '2026-01-01', true),
('mistral', 'mistral-nemo', 'Mistral Nemo', 0.0003, 0.0003, '2026-01-01', true);

-- Cohere Models
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('cohere', 'command-r-plus', 'Command R+', 0.003, 0.015, '2026-01-01', true),
('cohere', 'command-r', 'Command R', 0.0005, 0.0015, '2026-01-01', true),
('cohere', 'command-light', 'Command Light', 0.0003, 0.0006, '2026-01-01', true);

-- AWS Bedrock (priced same as underlying models, representative)
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('bedrock', 'anthropic.claude-3-5-sonnet', 'Claude 3.5 Sonnet (Bedrock)', 0.003, 0.015, '2026-01-01', true),
('bedrock', 'anthropic.claude-3-haiku', 'Claude 3 Haiku (Bedrock)', 0.00025, 0.00125, '2026-01-01', true),
('bedrock', 'amazon.titan-text-express', 'Titan Text Express', 0.0002, 0.0006, '2026-01-01', true),
('bedrock', 'meta.llama3-70b-instruct', 'Llama 3 70B (Bedrock)', 0.00265, 0.0035, '2026-01-01', true);

-- Azure OpenAI (priced same as OpenAI)
INSERT INTO public.model_pricing (provider, model_id, model_name, input_price_per_1k, output_price_per_1k, effective_date, is_current) VALUES
('azure_openai', 'gpt-4o', 'GPT-4o (Azure)', 0.0025, 0.01, '2026-01-01', true),
('azure_openai', 'gpt-4o-mini', 'GPT-4o Mini (Azure)', 0.00015, 0.0006, '2026-01-01', true),
('azure_openai', 'gpt-4-turbo', 'GPT-4 Turbo (Azure)', 0.01, 0.03, '2026-01-01', true);
