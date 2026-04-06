import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { verifyCronAuth } from '@/lib/api/verify-cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const PROVIDER_SOURCES = [
  { provider: 'openai', url: 'https://developers.openai.com/api/docs/pricing' },
  { provider: 'anthropic', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
  { provider: 'gemini', url: 'https://ai.google.dev/gemini-api/docs/pricing' },
  { provider: 'grok', url: 'https://docs.x.ai/docs/models' },
  { provider: 'deepseek', url: 'https://api-docs.deepseek.com/quick_start/pricing' },
  { provider: 'moonshot', url: 'https://platform.moonshot.ai/docs/pricing/chat' },
  { provider: 'elevenlabs', url: 'https://elevenlabs.io/pricing/api' },
] as const;

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildModelAliases(model: string, modelDisplay: string | null) {
  const aliases = new Set<string>([
    model.toLowerCase(),
    model.toLowerCase().replace(/-/g, ' '),
  ]);

  if (modelDisplay) {
    aliases.add(modelDisplay.toLowerCase());
  }

  return Array.from(aliases);
}

function extractTokenPricing(text: string, aliases: string[]) {
  for (const alias of aliases) {
    const pattern = new RegExp(`${escapeForRegex(alias)}[\\s\\S]{0,220}?\\$([0-9]+(?:\\.[0-9]+)?)\\s*[\\|/\\-–]?\\s*\\$([0-9]+(?:\\.[0-9]+)?)`, 'i');
    const match = text.match(pattern);
    if (match?.[1] && match[2]) {
      return {
        input_per_mtok: Number(match[1]),
        output_per_mtok: Number(match[2]),
      };
    }
  }

  return null;
}

function extractSinglePrice(text: string, aliases: string[]) {
  for (const alias of aliases) {
    const pattern = new RegExp(`${escapeForRegex(alias)}[\\s\\S]{0,180}?\\$([0-9]+(?:\\.[0-9]+)?)`, 'i');
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

async function fetchProviderText(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'API Lens Price Updater',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }

  return response.text();
}

function buildSummaryHtml(summary: {
  updated: number;
  added: number;
  deprecated: number;
  errors: string[];
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <h2 style="margin: 0 0 16px;">API Lens Price Update</h2>
      <p style="margin: 0 0 8px;">Updated: <strong>${summary.updated}</strong></p>
      <p style="margin: 0 0 8px;">Added: <strong>${summary.added}</strong></p>
      <p style="margin: 0 0 16px;">Deprecated: <strong>${summary.deprecated}</strong></p>
      <h3 style="margin: 0 0 8px;">Errors / Manual Review</h3>
      <ul>
        ${summary.errors.length > 0
          ? summary.errors.map((error) => `<li>${error}</li>`).join('')
          : '<li>No parse failures.</li>'}
      </ul>
    </div>
  `;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'), process.env.CRON_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const summary = {
    updated: 0,
    added: 0,
    deprecated: 0,
    errors: [] as string[],
  };

  const { data: currentRows, error } = await supabase
    .from('price_snapshots')
    .select('provider, model, model_display, unit_type, input_per_mtok, output_per_mtok, per_unit_price')
    .order('provider')
    .order('model');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const source of PROVIDER_SOURCES) {
    try {
      const providerRows = (currentRows ?? []).filter((row) => row.provider === source.provider);
      const text = (await fetchProviderText(source.url)).toLowerCase();
      let providerParsedCount = 0;
      const updates: Array<Record<string, unknown>> = [];
      const seenModels = new Set<string>();

      for (const row of providerRows) {
        const aliases = buildModelAliases(row.model, row.model_display);
        const matchedAlias = aliases.find((alias) => text.includes(alias));
        if (matchedAlias) {
          seenModels.add(row.model);
        }

        if (row.unit_type === 'tokens') {
          const parsed = extractTokenPricing(text, aliases);
          if (!parsed) continue;

          providerParsedCount++;
          if (
            Number(row.input_per_mtok) !== parsed.input_per_mtok ||
            Number(row.output_per_mtok) !== parsed.output_per_mtok
          ) {
            updates.push({
              provider: row.provider,
              model: row.model,
              input_per_mtok: parsed.input_per_mtok,
              output_per_mtok: parsed.output_per_mtok,
              captured_at: new Date().toISOString(),
              is_deprecated: false,
            });
          }
          continue;
        }

        const price = extractSinglePrice(text, aliases);
        if (price == null) continue;

        providerParsedCount++;
        if (Number(row.per_unit_price ?? 0) !== price) {
          updates.push({
            provider: row.provider,
            model: row.model,
            per_unit_price: price,
            captured_at: new Date().toISOString(),
            is_deprecated: false,
          });
        }
      }

      if (providerParsedCount === 0) {
        summary.errors.push(`${source.provider}: manual review needed (no parsable pricing matches found)`);
        continue;
      }

      if (updates.length > 0) {
        const { error: upsertError, data: updatedRows } = await supabase
          .from('price_snapshots')
          .upsert(updates, { onConflict: 'provider,model' })
          .select('provider, model');

        if (upsertError) {
          summary.errors.push(`${source.provider}: ${upsertError.message}`);
        } else {
          summary.updated += updatedRows?.length ?? updates.length;
        }
      }

      const deprecatedCandidates = providerRows
        .filter((row) => !seenModels.has(row.model))
        .map((row) => row.model);

      if (deprecatedCandidates.length > 0) {
        const { error: deprecatedError, count } = await supabase
          .from('price_snapshots')
          .update({
            is_deprecated: true,
            captured_at: new Date().toISOString(),
          }, { count: 'exact' })
          .eq('provider', source.provider)
          .in('model', deprecatedCandidates);

        if (deprecatedError) {
          summary.errors.push(`${source.provider}: failed to mark deprecated models (${deprecatedError.message})`);
        } else {
          summary.deprecated += count ?? 0;
        }
      }
    } catch (providerError) {
      summary.errors.push(
        `${source.provider}: ${providerError instanceof Error ? providerError.message : 'Unknown parse failure'}`,
      );
    }
  }

  await sendEmail({
    to: 'support@apilens.tech',
    subject: `API Lens Price Update - ${new Date().toISOString().slice(0, 10)}`,
    html: buildSummaryHtml(summary),
  });

  return NextResponse.json({
    success: true,
    ...summary,
    timestamp: new Date().toISOString(),
  });
}
