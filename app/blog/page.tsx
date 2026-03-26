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
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-16">
        {/* ─── Hero Section ─── */}
        <section className="relative py-20 md:py-28 px-6 overflow-hidden">
          {/* Radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              Latest guides &amp; insights
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              API Lens{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                Blog
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Guides on AI API costs, security, and building smarter.
            </p>
          </div>
        </section>

        {/* ─── Blog Posts Grid ─── */}
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500 text-lg">No posts published yet. Check back soon.</p>
              </div>
            ) : (
              <ol className="space-y-6" aria-label="Blog posts">
                {posts.map((post) => {
                  const formattedDate = post.date
                    ? new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : null;

                  return (
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group block bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-7 hover:border-zinc-700/80 hover:bg-zinc-900/60 hover:shadow-[0_0_40px_rgba(59,130,246,0.06)] transition-all duration-300"
                      >
                        {/* Meta row */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                          {formattedDate && <span>{formattedDate}</span>}
                          {formattedDate && post.readTime && (
                            <span className="text-zinc-700">·</span>
                          )}
                          {post.readTime && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 font-medium">
                              {post.readTime}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors leading-snug mb-2">
                          {post.title}
                        </h2>

                        {/* Description */}
                        {post.description && (
                          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-4">
                            {post.description}
                          </p>
                        )}

                        {/* Footer row: tags + CTA */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* Tag pills */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-xs rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Read article link */}
                          <span className="flex items-center gap-1 text-sm text-brand-400 font-medium group-hover:underline underline-offset-2 shrink-0 ml-auto">
                            Read article
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
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
