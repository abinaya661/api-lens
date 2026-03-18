import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/app/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'API Lens — Track Your AI API Spending',
    template: '%s | API Lens',
  },
  description: 'Monitor and optimize your AI API costs across OpenAI, Anthropic, Gemini, Mistral, and 10+ providers. Real-time spending dashboards, budget alerts, and usage analytics.',
  keywords: ['AI API', 'cost tracking', 'API spending', 'OpenAI costs', 'Anthropic billing', 'AI budget', 'API monitoring'],
  authors: [{ name: 'API Lens' }],
  openGraph: {
    title: 'API Lens — Track Your AI API Spending',
    description: 'Monitor and optimize your AI API costs across 14+ providers.',
    url: 'https://apilens.dev',
    siteName: 'API Lens',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Lens — Track Your AI API Spending',
    description: 'Monitor and optimize your AI API costs across 14+ providers.',
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
