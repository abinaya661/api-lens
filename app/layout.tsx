import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/app/providers';
import { JsonLd } from '@/components/shared/json-ld';
import { buildWebSiteSchema, buildOrganizationSchema } from '@/lib/structured-data';

const geistSans = localFont({
  src: [
    { path: '../public/fonts/geist-latin-ext.woff2', weight: '100 900' },
    { path: '../public/fonts/geist-latin.woff2', weight: '100 900' },
  ],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'API Lens - Track Your AI API Spending',
    template: '%s | API Lens',
  },
  description: 'The ultimate AI API key manager. Monitor and optimize your AI API costs across OpenAI, Anthropic, Gemini, Mistral, and 14+ providers. Real-time spending dashboards, budget alerts, and usage analytics.',
  keywords: ['API key manager', 'AI API management', 'cost tracking', 'API spending', 'OpenAI costs', 'Anthropic billing', 'AI budget', 'API monitoring'],
  authors: [{ name: 'API Lens' }],
  openGraph: {
    title: 'API Lens - Track Your AI API Spending',
    description: 'Monitor and optimize your AI API costs across 14+ providers.',
    url: 'https://apilens.tech',
    siteName: 'API Lens',
    type: 'website',
    images: [
      {
        url: 'https://apilens.tech/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'API Lens - Ultimate AI API Key Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Lens - Track Your AI API Spending',
    description: 'Monitor and optimize your AI API costs across 14+ providers.',
    images: ['https://apilens.tech/logo.jpg'],
  },
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Global structured data present on every page */}
        <JsonLd data={buildWebSiteSchema()} />
        <JsonLd data={buildOrganizationSchema()} />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(24, 24, 27, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  );
}
