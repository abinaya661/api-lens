import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/keys/', '/projects/', '/budgets/', '/alerts/', '/settings/', '/onboarding/'],
      },
    ],
    sitemap: 'https://apilens.dev/sitemap.xml',
  };
}
