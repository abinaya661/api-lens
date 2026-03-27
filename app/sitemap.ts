import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech';

  const routes = [
    '',
    '/blog',
    '/blog/ai-billing-alerts-wont-stop-charges',
    '/blog/ai-agent-infinite-loop-billing-disaster',
    '/blog/ai-model-cost-comparison-2026',
    '/blog/ai-api-budget-alerts-50-70-90-rule',
    '/blog/unified-ai-api-dashboard-multi-provider',
    '/estimator',
    '/security',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route.startsWith('/blog/') ? 'monthly' : route === '/blog' ? 'weekly' : 'monthly') as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: route === '' ? 1 : route === '/blog' ? 0.8 : route.startsWith('/blog/') ? 0.7 : 0.6,
  }));

  return routes;
}
