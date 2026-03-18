import { BaseAdapter } from './base';
import type { SyncResult, UsageRow } from '../types';

export class DeepgramAdapter extends BaseAdapter {
  provider = 'deepgram';

  async fetchUsage(apiKey: string, dateFrom: string, dateTo: string): Promise<SyncResult> {
    try {
      // First, get the project ID
      const projectsRes = await fetch('https://api.deepgram.com/v1/projects', {
        headers: { 'Authorization': `Token ${apiKey}` },
      });

      if (!projectsRes.ok) {
        const body = await projectsRes.text();
        return this.makeSyncResult(this.provider, [], `Deepgram projects error ${projectsRes.status}: ${body}`);
      }

      const projectsData = await projectsRes.json();
      const projects = projectsData.projects ?? [];

      if (projects.length === 0) {
        return this.makeSyncResult(this.provider, [], 'No Deepgram projects found');
      }

      const rows: UsageRow[] = [];

      for (const project of projects) {
        const projectId = project.project_id;
        const usageUrl = `https://api.deepgram.com/v1/projects/${projectId}/usage?start=${dateFrom}&end=${dateTo}`;

        const usageRes = await fetch(usageUrl, {
          headers: { 'Authorization': `Token ${apiKey}` },
        });

        if (!usageRes.ok) {
          continue;
        }

        const usageData = await usageRes.json();
        const results = usageData.results ?? [];

        for (const entry of results) {
          const hours = entry.hours ?? 0;
          const seconds = Math.round(hours * 3600);

          rows.push({
            date: entry.start ?? dateFrom,
            model: entry.model ?? entry.tag ?? 'deepgram',
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: entry.amount ?? 0,
            request_count: entry.requests ?? 0,
            unit_type: 'seconds',
            unit_count: seconds,
          });
        }
      }

      return this.makeSyncResult(this.provider, rows);
    } catch (e: unknown) {
      return this.makeSyncResult(
        this.provider,
        [],
        e instanceof Error ? e.message : 'Unknown error fetching Deepgram usage',
      );
    }
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.deepgram.com/v1/projects', {
        headers: { 'Authorization': `Token ${apiKey}` },
      });

      if (res.ok) {
        return { valid: true };
      }

      const body = await res.text();
      return { valid: false, error: `Deepgram returned ${res.status}: ${body}` };
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Validation failed' };
    }
  }
}
