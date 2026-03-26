/**
 * app/blog/page.tsx  —  Blog index page
 *
 * Structured data emitted:
 *   - ItemList  (Schema 8) — lists every post as a BlogPosting ListItem
 *
 * The POSTS array below is the single source of truth for all blog content.
 * Add a new entry here whenever a new post is published; the ItemList schema,
 * the page listing, and the sitemap all derive from this array.
 *
 * For a CMS-driven site, replace this static array with a call to your
 * content layer (e.g. next-mdx-remote, Contentlayer, or a headless CMS SDK)
 * and pass the resulting data to buildBlogIndexItemListSchema().
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/shared/json-ld';
import { buildBlogIndexItemListSchema, type BlogIndexItem } from '@/lib/structured-data';

// ─────────────────────────────────────────────────────────────────────────────
// Blog post registry — update this array as posts are published
// ─────────────────────────────────────────────────────────────────────────────

export const BLOG_POSTS: BlogIndexItem[] = [
  {
    position: 1,
    name: 'Why Your AI API Bill Is Higher Than You Think',
    url: 'https://apilens.tech/blog/why-your-ai-api-bill-is-higher-than-you-think',
    description:
      'Hidden costs in AI API pricing — from prompt caching charges to context-window bloat — and how to surface them before your next invoice arrives.',
    datePublished: '2026-03-10',
    imageUrl: 'https://apilens.tech/blog/why-your-ai-api-bill-is-higher-than-you-think/og.png',
  },
  {
    position: 2,
    name: 'How to Set AI API Budgets to Prevent Cost Overruns',
    url: 'https://apilens.tech/blog/how-to-set-ai-api-budgets',
    description:
      'A practical, step-by-step guide to configuring spending limits and multi-tier alerts for every AI provider your team uses.',
    datePublished: '2026-03-20',
    imageUrl: 'https://apilens.tech/blog/how-to-set-ai-api-budgets/og.png',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page metadata
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Blog — AI Cost Management Guides',
  description:
    'Guides, tutorials, and best practices for managing AI API costs, setting budgets, and optimising spend across OpenAI, Anthropic, Gemini, and more.',
  openGraph: {
    title: 'API Lens Blog — AI Cost Management Guides',
    description:
      'Guides, tutorials, and best practices for managing AI API costs across OpenAI, Anthropic, Gemini, and more.',
    url: 'https://apilens.tech/blog',
    siteName: 'API Lens',
    type: 'website',
  },
  alternates: { canonical: 'https://apilens.tech/blog' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function BlogIndexPage() {
  return (
    <>
      {/* Schema 8 — ItemList for the blog index */}
      <JsonLd data={buildBlogIndexItemListSchema(BLOG_POSTS)} />

      <main className="min-h-screen bg-black text-zinc-300 px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">API Lens Blog</h1>
          <p className="text-zinc-400 mb-12 text-lg">
            Guides on managing AI API costs, setting budgets, and optimising spend.
          </p>

          <ol className="space-y-8" aria-label="Blog posts">
            {BLOG_POSTS.map((post) => (
              <li key={post.url} className="border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                <Link href={post.url} className="group">
                  <p className="text-xs text-zinc-500 mb-2">
                    {post.datePublished
                      ? new Date(post.datePublished).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : null}
                  </p>
                  <h2 className="text-xl font-semibold text-white group-hover:text-brand-400 transition-colors mb-2">
                    {post.name}
                  </h2>
                  {post.description && (
                    <p className="text-zinc-400 text-sm leading-relaxed">{post.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}
