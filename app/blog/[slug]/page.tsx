/**
 * app/blog/[slug]/page.tsx  —  Individual blog post page
 *
 * Structured data emitted (all schemas co-located in the same page):
 *   - BlogPosting    (Schema 4) — full article metadata
 *   - BreadcrumbList (Schema 5) — Home > Blog > Post Title
 *   - HowTo          (Schema 7) — only injected for post slug
 *                                 "how-to-set-ai-api-budgets"
 *
 * How dynamic values are sourced:
 *   All {{placeholder}} fields in the schemas come from the POST_REGISTRY
 *   record below, which maps URL slugs to post frontmatter objects.
 *   In a CMS/MDX setup, replace POST_REGISTRY with a call to your content
 *   layer and pass the result to the builder functions.
 *
 * Implementation pattern for Next.js App Router:
 *   - generateStaticParams()  → pre-renders all known slugs at build time
 *   - generateMetadata()      → per-post <title>, <meta description>, OG tags
 *   - Page component          → renders <JsonLd> blocks + article HTML
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/shared/json-ld';
import {
  buildBlogPostingSchema,
  buildBlogPostBreadcrumbSchema,
  buildHowToSetAIBudgetsSchema,
  type BlogPostingInput,
} from '@/lib/structured-data';

// ─────────────────────────────────────────────────────────────────────────────
// Post registry
// Add a new entry for every published post.  The key must exactly match the
// URL slug (the [slug] segment in the route).
// ─────────────────────────────────────────────────────────────────────────────

type PostMeta = BlogPostingInput & {
  /** Rendered article HTML or plain-text body for the page */
  bodyHtml?: string;
};

const POST_REGISTRY: Record<string, PostMeta> = {
  'why-your-ai-api-bill-is-higher-than-you-think': {
    headline: 'Why Your AI API Bill Is Higher Than You Think',
    description:
      'Hidden costs in AI API pricing — from prompt caching charges to context-window bloat — and how to surface them before your next invoice arrives.',
    authorName: 'API Lens Team',
    authorUrl: 'https://apilens.tech',
    datePublished: '2026-03-10',
    dateModified: '2026-03-10',
    imageUrl:
      'https://apilens.tech/blog/why-your-ai-api-bill-is-higher-than-you-think/og.png',
    url: 'https://apilens.tech/blog/why-your-ai-api-bill-is-higher-than-you-think',
    keywords: [
      'AI API cost',
      'OpenAI billing',
      'Anthropic pricing',
      'AI budget',
      'token cost',
      'API monitoring',
    ],
    articleBodySummary:
      'Most engineering teams underestimate their AI API spend by 30–60%. The gap comes from three sources that never appear on a model pricing page: prompt caching surcharges, context-window bloat from large system prompts, and per-request overhead fees charged by middleware layers...',
  },

  'how-to-set-ai-api-budgets': {
    headline: 'How to Set AI API Budgets to Prevent Cost Overruns',
    description:
      'A practical, step-by-step guide to configuring spending limits and multi-tier alerts for every AI provider your team uses.',
    authorName: 'API Lens Team',
    authorUrl: 'https://apilens.tech',
    datePublished: '2026-03-20',
    dateModified: '2026-03-20',
    imageUrl: 'https://apilens.tech/blog/how-to-set-ai-api-budgets/og.png',
    url: 'https://apilens.tech/blog/how-to-set-ai-api-budgets',
    keywords: [
      'AI API budget',
      'AI cost monitoring',
      'OpenAI spending limit',
      'Anthropic budget alert',
      'API Lens',
      'prevent AI cost overrun',
    ],
    articleBodySummary:
      'Setting a budget for your AI API usage is the single highest-ROI action you can take to prevent bill shock. In this guide we walk through connecting your first provider key, choosing a budget scope (global, per-provider, per-project, or per-key), entering a monthly cap, and interpreting the live utilisation bars...',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Next.js static-params & metadata
// ─────────────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(POST_REGISTRY).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POST_REGISTRY[slug];
  if (!post) return {};

  return {
    title: post.headline,
    description: post.description,
    openGraph: {
      title: post.headline,
      description: post.description,
      url: post.url,
      siteName: 'API Lens',
      type: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified ?? post.datePublished,
      images: [{ url: post.imageUrl, width: 1200, height: 630, alt: post.headline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.headline,
      description: post.description,
      images: [post.imageUrl],
    },
    alternates: { canonical: post.url },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POST_REGISTRY[slug];
  if (!post) notFound();

  // Schema 4 — BlogPosting
  const blogPostingSchema = buildBlogPostingSchema(post);

  // Schema 5 — BreadcrumbList: Home > Blog > Post Title
  const breadcrumbSchema = buildBlogPostBreadcrumbSchema(post.headline, post.url);

  // Schema 7 — HowTo: only for the budgets guide
  const howToSchema =
    slug === 'how-to-set-ai-api-budgets' ? buildHowToSetAIBudgetsSchema() : null;

  return (
    <>
      {/* Structured data injected into <head> by Next.js hoisting */}
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={breadcrumbSchema} />
      {howToSchema && <JsonLd data={howToSchema} />}

      <main className="min-h-screen bg-black text-zinc-300 px-6 py-24">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb nav (visible UI — mirrors BreadcrumbList schema) */}
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
            <ol className="flex items-center gap-2">
              <li>
                <a href="https://apilens.tech" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a href="https://apilens.tech/blog" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-zinc-300 truncate max-w-[200px]">{post.headline}</li>
            </ol>
          </nav>

          <article>
            <header className="mb-10">
              {post.datePublished && (
                <time
                  dateTime={post.datePublished}
                  className="text-xs text-zinc-500 block mb-3"
                >
                  {new Date(post.datePublished).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
              <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                {post.headline}
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed">{post.description}</p>
            </header>

            {/* Article body — replace with MDX/CMS rendered content */}
            {post.bodyHtml ? (
              <div
                className="prose prose-invert prose-zinc max-w-none"
                dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
              />
            ) : (
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-400">
                  {/* Placeholder — replace with your MDX or CMS content renderer */}
                  Article content goes here.
                </p>
              </div>
            )}
          </article>
        </div>
      </main>
    </>
  );
}
