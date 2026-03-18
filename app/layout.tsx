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
    default: 'API Lens — AI Cost Dashboard',
    template: '%s | API Lens',
  },
  description:
    'Monitor, budget, and attribute AI API costs across OpenAI, Anthropic, Gemini, Bedrock, Mistral, Cohere, and Azure OpenAI — all in one dashboard.',
  keywords: [
    'AI API costs',
    'OpenAI billing',
    'Anthropic costs',
    'API monitoring',
    'AI budget tracker',
  ],
  authors: [{ name: 'API Lens' }],
  openGraph: {
    title: 'API Lens — AI Cost Dashboard',
    description:
      'One dashboard to monitor, budget, and attribute AI API costs across all providers.',
    type: 'website',
    locale: 'en_US',
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
