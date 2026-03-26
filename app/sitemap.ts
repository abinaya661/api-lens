import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech';
  
  const routes = [
    '',
    '/blog',
    '/pricing',
    '/estimator',
    '/security',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.includes('blog') ? 'daily' : ('monthly' as any),
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
