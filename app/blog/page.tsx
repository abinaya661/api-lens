/**
 * app/blog/page.tsx  —  Blog index page
 *
 * Structured data emitted:
 *   - ItemList  (Schema 8) — lists every post as a BlogPosting ListItem
 *
 * Posts are read dynamically from getAllPosts() in @/lib/blog.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { JsonLd } from '@/components/shared/json-ld';
import { buildBlogIndexItemListSchema } from '@/lib/structured-data';
import { getAllPosts } from '@/lib/blog';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { RevealOnScroll } from '@/components/landing/reveal-on-scroll';

// ─────────────────────────────────────────────────────────────────────────────
// Page metadata
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Blog — AI API Cost Guides',
  description:
    'Guides on managing AI API costs, key security, and building smarter with OpenAI, Anthropic, Gemini, and more.',
  openGraph: {
    title: 'API Lens Blog — AI API Cost Guides',
    description:
      'Guides on managing AI API costs, key security, and building smarter with OpenAI, Anthropic, Gemini, and more.',
    url: 'https://apilens.tech/blog',
    siteName: 'API Lens',
    type: 'website',
  },
  alternates: { canonical: 'https://apilens.tech/blog' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  const blogIndexItems = posts.map((post, i) => ({
    position: i + 1,
    name: post.title,
    url: `https://apilens.tech/blog/${post.slug}`,
    description: post.description,
    datePublished: post.date,
  }));

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-brand-500/30 relative overflow-x-hidden">
      {/* Structured data */}
      <JsonLd data={buildBlogIndexItemListSchema(blogIndexItems)} />

      {/* ─── Sticky Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">API Lens</span>
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-brand-400 transition-colors hidden sm:block"
            >
              Blog
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-zinc-100 text-black hover:bg-zinc-200 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-16">
        {/* ─── Background Mesh ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
        </div>

        {/* ─── Hero Section ─── */}
        <section className="relative py-20 md:py-32 px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                Latest guides &amp; insights
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-8">
                Our latest{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-500 to-brand-600">
                  insights.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Expert guides on AI model costs, API governance, and scaling your intelligence infrastructure.
              </p>
            </RevealOnScroll>
          </div>
        </section>

        {/* ─── Blog Posts Grid ─── */}
        <section className="px-6 pb-24 relative z-10">
          <div className="max-w-3xl mx-auto">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500 text-lg">No posts published yet. Check back soon.</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {posts.map((post) => {
                  const formattedDate = post.date
                    ? new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : null;

                  return (
                    <RevealOnScroll key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group relative block"
                      >
                        {/* Interactive blur bg */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-brand-500/0 via-brand-500/0 to-brand-500/0 group-hover:from-brand-500/5 group-hover:to-brand-500/10 rounded-3xl blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                        
                        <div className="relative bg-zinc-900/30 backdrop-blur-md border border-zinc-800/40 rounded-2xl p-8 hover:border-brand-500/30 hover:shadow-[0_0_50px_rgba(59,130,246,0.1)] transition-all duration-500">
                          {/* Meta row */}
                          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 font-medium uppercase tracking-widest">
                            {formattedDate && <span>{formattedDate}</span>}
                            {post.readTime && (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/30 text-zinc-400">
                                {post.readTime}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors leading-tight mb-4">
                            {post.title}
                          </h2>

                          {/* Description */}
                          {post.description && (
                            <p className="text-zinc-400 text-lg leading-relaxed line-clamp-2 mb-6 group-hover:text-zinc-300 transition-colors">
                              {post.description}
                            </p>
                          )}

                          {/* Footer row: tags + CTA */}
                          <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-zinc-800/50">
                            {post.tags && (
                              <div className="flex flex-wrap gap-2">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2.5 py-1 text-[10px] rounded-md bg-zinc-800/50 text-zinc-400 border border-zinc-700/30 font-bold uppercase tracking-wider"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <span className="flex items-center gap-2 text-sm text-brand-400 font-bold group-hover:translate-x-1 transition-transform">
                              EXPLORE
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </RevealOnScroll>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-12 px-6 border-t border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-sm">API Lens</span>
            <span className="text-zinc-600 text-sm ml-4">© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-white transition">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
